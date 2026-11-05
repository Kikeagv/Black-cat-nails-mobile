/**
 * SERVICIO DE AUTENTICACIÓN — Firebase Authentication + perfil en Firestore
 *
 * Firebase Auth guarda la identidad (correo/contraseña o cuenta de Google) y
 * la sesión. Firestore guarda el perfil del negocio en usuarias/{uid}: nombre,
 * teléfono, rol, inasistencias y código de referido. Las pantallas nunca llaman
 * a este módulo directamente, sino a través de AuthContext.
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { firebaseConfigurado, usarEmuladores } from '@/config/firebase';
import { generarCodigoReferido } from '@/domain';
import {
  completarPerfilSchema,
  CompletarPerfilInput,
  LoginInput,
  loginSchema,
  RegistroInput,
  registroSchema,
} from '@/schemas/auth';
import { perfilSchema, PerfilInput } from '@/schemas/perfil';
import { Usuaria } from '@/types';
import * as actividad from './actividadService';
import { conFirebase, ServiceError, traducirErrorFirebase } from './errores';
import { obtenerDb } from './firebase/app';
import { obtenerAuth } from './firebase/auth';
import { colReferidos, refCodigo, refReferido, refUsuaria } from './firebase/colecciones';
import { cerrarSesionGoogle, iniciarConGoogle } from './firebase/googleSignIn';

export type EstadoSesion =
  | { tipo: 'sin_sesion' }
  | { tipo: 'activa'; usuaria: Usuaria }
  /** Entró con Google por primera vez: falta el teléfono para crear su perfil. */
  | { tipo: 'perfil_pendiente'; nombre: string; correo: string };

function asegurarConfig() {
  if (!firebaseConfigurado && !usarEmuladores) {
    throw new ServiceError('firebase_no_configurado', 'Firebase no está configurado. Revisá el archivo .env.');
  }
}

function proveedorDe(user: User): 'password' | 'google' {
  return user.providerData.some((p) => p.providerId === 'google.com') ? 'google' : 'password';
}

/** Mientras se crea la cuenta, Auth ya tiene usuario pero el perfil todavía no existe. */
let creandoPerfil = false;

/**
 * Observa la sesión de Firebase y el documento de perfil de la usuaria.
 * Cualquier cambio en usuarias/{uid} (por ejemplo, la administradora suma una
 * inasistencia) llega a la app sin recargar.
 */
export function observarSesion(alCambiar: (estado: EstadoSesion) => void): () => void {
  if (!firebaseConfigurado && !usarEmuladores) {
    alCambiar({ tipo: 'sin_sesion' });
    return () => {};
  }
  const auth = obtenerAuth();
  let dejarDeObservarPerfil: (() => void) | null = null;

  const dejarDeObservarAuth = onAuthStateChanged(auth, (user) => {
    dejarDeObservarPerfil?.();
    dejarDeObservarPerfil = null;
    if (!user) return alCambiar({ tipo: 'sin_sesion' });

    dejarDeObservarPerfil = onSnapshot(
      refUsuaria(user.uid),
      (snap) => {
        if (!snap.exists()) {
          if (creandoPerfil) return; // el registro escribe el perfil en un instante
          return alCambiar({
            tipo: 'perfil_pendiente',
            nombre: user.displayName ?? '',
            correo: user.email ?? '',
          });
        }
        const usuaria = { id: snap.id, ...snap.data() } as Usuaria;
        // Si cambió su correo con el enlace de verificación, se sincroniza el perfil.
        if (user.email && usuaria.correo !== user.email.toLowerCase()) {
          updateDoc(refUsuaria(user.uid), { correo: user.email.toLowerCase() }).catch(() => {});
        }
        alCambiar({ tipo: 'activa', usuaria });
      },
      (e) => {
        if (__DEV__) console.warn('[auth] perfil', e);
        alCambiar({ tipo: 'sin_sesion' });
      }
    );
  });

  return () => {
    dejarDeObservarPerfil?.();
    dejarDeObservarAuth();
  };
}

export async function login(datos: LoginInput): Promise<void> {
  // La validación se repite aquí aunque la pantalla ya validó: segunda barrera.
  const parsed = loginSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);
  asegurarConfig();

  const cred = await conFirebase(() =>
    signInWithEmailAndPassword(obtenerAuth(), parsed.data.correo.toLowerCase(), parsed.data.password)
  );
  actividad.registrar(cred.user.uid, 'inicio_sesion', 'Iniciaste sesión con tu correo');
}

export async function loginConGoogle(): Promise<void> {
  asegurarConfig();
  const cred = await conFirebase(() => iniciarConGoogle());
  const perfil = await getDoc(refUsuaria(cred.user.uid)).catch(() => null);
  if (perfil?.exists()) actividad.registrar(cred.user.uid, 'inicio_sesion', 'Iniciaste sesión con Google');
}

export async function recuperarPassword(correo: string): Promise<void> {
  const parsed = loginSchema.shape.correo.safeParse(correo);
  if (!parsed.success) throw new ServiceError('validacion', 'Escribí tu correo para enviarte el enlace');
  asegurarConfig();
  try {
    await sendPasswordResetEmail(obtenerAuth(), parsed.data.toLowerCase());
  } catch (e) {
    // Si el correo no existe se responde igual, para no revelar qué cuentas hay.
    const err = traducirErrorFirebase(e);
    if (err.code !== 'credenciales_invalidas') throw err;
  }
}

/** Busca un código libre: CAMI2026, y si ya existe, CAMA2026, CAMB2026… */
async function generarCodigoUnico(nombre: string): Promise<string> {
  const usados: string[] = [];
  for (let i = 0; i < 27; i++) {
    const codigo = generarCodigoReferido(nombre, usados);
    const existe = await getDoc(refCodigo(codigo));
    if (!existe.exists()) return codigo;
    usados.push(codigo);
  }
  throw new ServiceError('red', 'No se pudo generar tu código de referido. Intentá de nuevo.');
}

async function validarCodigoReferido(codigo?: string): Promise<string | undefined> {
  if (!codigo) return undefined;
  const snap = await conFirebase(() => getDoc(refCodigo(codigo)));
  if (!snap.exists()) throw new ServiceError('codigo_referido_invalido', 'El código de referido no existe');
  return codigo;
}

/**
 * Crea el perfil en Firestore con una escritura atómica (batch): el perfil, la
 * reserva del código de referido y, si aplica, el registro de quién la refirió.
 * Las reglas de seguridad verifican que las tres escrituras sean coherentes.
 */
async function crearPerfil(
  user: User,
  datos: { nombre: string; telefono: string; referidaPor?: string }
): Promise<Usuaria> {
  const codigoReferido = await generarCodigoUnico(datos.nombre);
  const usuaria: Usuaria = {
    id: user.uid,
    nombre: datos.nombre.trim(),
    correo: (user.email ?? '').toLowerCase(),
    telefono: datos.telefono,
    rol: 'clienta', // el registro público nunca crea administradoras (lo exigen las reglas)
    inasistencias: 0,
    codigoReferido,
    proveedor: proveedorDe(user),
    creadaEn: new Date().toISOString(),
    ...(datos.referidaPor ? { referidaPor: datos.referidaPor } : {}),
  };
  const { id: _id, ...perfil } = usuaria;

  const batch = writeBatch(obtenerDb());
  batch.set(refUsuaria(user.uid), { ...perfil, actualizadaEn: serverTimestamp() });
  batch.set(refCodigo(codigoReferido), { uid: user.uid });
  if (datos.referidaPor) {
    batch.set(refReferido(user.uid), {
      codigoReferente: datos.referidaPor,
      nombre: usuaria.nombre,
      creadaEn: usuaria.creadaEn,
    });
  }
  await batch.commit();
  actividad.registrar(
    user.uid,
    'registro',
    datos.referidaPor ? `Creaste tu cuenta con el código ${datos.referidaPor}` : 'Creaste tu cuenta en Black Cat Nails'
  );
  return usuaria;
}

export async function registro(datos: RegistroInput): Promise<void> {
  const parsed = registroSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);
  asegurarConfig();
  const d = parsed.data;

  const referidaPor = await validarCodigoReferido(d.codigoReferido || undefined);

  creandoPerfil = true;
  try {
    const cred = await conFirebase(() =>
      createUserWithEmailAndPassword(obtenerAuth(), d.correo.toLowerCase(), d.password)
    );
    try {
      await updateProfile(cred.user, { displayName: d.nombre.trim() });
      await crearPerfil(cred.user, { nombre: d.nombre, telefono: d.telefono, referidaPor });
    } catch (e) {
      // Si el perfil no se pudo guardar, se borra la cuenta para no dejarla a medias.
      await cred.user.delete().catch(() => {});
      throw traducirErrorFirebase(e);
    }
  } finally {
    creandoPerfil = false;
  }
}

/** Primer ingreso con Google: completa el teléfono (y código de referido) que Google no da. */
export async function completarPerfil(datos: CompletarPerfilInput): Promise<void> {
  const parsed = completarPerfilSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);
  const user = obtenerAuth().currentUser;
  if (!user) throw new ServiceError('sesion_expirada', 'Tu sesión expiró. Volvé a iniciar sesión.');

  const referidaPor = await validarCodigoReferido(parsed.data.codigoReferido || undefined);
  await conFirebase(() =>
    crearPerfil(user, { nombre: parsed.data.nombre, telefono: parsed.data.telefono, referidaPor })
  );
}

export async function cerrarSesion(): Promise<void> {
  await cerrarSesionGoogle();
  await signOut(obtenerAuth());
}

/**
 * Actualiza teléfono o foto en Firestore. El correo es parte de la identidad de
 * Firebase Auth: se pide con verifyBeforeUpdateEmail y solo cambia cuando la
 * clienta abre el enlace que le llega al correo nuevo.
 *
 * @returns un mensaje para mostrar si el cambio queda pendiente de verificación.
 */
export async function actualizarPerfil(
  usuaria: Usuaria,
  cambios: Partial<PerfilInput> & { fotoUri?: string }
): Promise<string | null> {
  const parsed = perfilSchema.partial().safeParse(cambios);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);
  const user = obtenerAuth().currentUser;
  if (!user || user.uid !== usuaria.id) {
    throw new ServiceError('sesion_expirada', 'Tu sesión expiró. Volvé a iniciar sesión.');
  }

  const correo = parsed.data.correo?.toLowerCase();
  if (correo && correo !== usuaria.correo) {
    if (proveedorDe(user) === 'google') {
      throw new ServiceError('validacion', 'Tu correo es el de tu cuenta de Google y se cambia desde Google.');
    }
    await conFirebase(() => verifyBeforeUpdateEmail(user, correo));
    actividad.registrar(user.uid, 'perfil_actualizado', `Pediste cambiar tu correo a ${correo}`);
    return `Te enviamos un enlace a ${correo}. Tu correo cambia cuando lo abrás.`;
  }

  if (parsed.data.telefono && parsed.data.telefono !== usuaria.telefono) {
    await conFirebase(() =>
      updateDoc(refUsuaria(user.uid), { telefono: parsed.data.telefono, actualizadaEn: serverTimestamp() })
    );
    actividad.registrar(user.uid, 'perfil_actualizado', 'Actualizaste tu teléfono');
  }

  if (cambios.fotoUri !== undefined) {
    await conFirebase(() =>
      updateDoc(refUsuaria(user.uid), { fotoUri: cambios.fotoUri, actualizadaEn: serverTimestamp() })
    );
    actividad.registrar(user.uid, 'foto_actualizada', 'Cambiaste tu foto de perfil');
  }
  return null;
}

/** Clientas que se registraron con el código de la usuaria. */
export async function listarReferidas(codigo: string): Promise<{ id: string; nombre: string }[]> {
  const snap = await conFirebase(() => getDocs(query(colReferidos(), where('codigoReferente', '==', codigo))));
  return snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre as string }));
}

/**
 * SERVICIO DE AUTENTICACIÓN (capa de datos)
 *
 * Expone la misma interfaz que tendrá con Firebase Authentication en el Foro 2:
 * login, registro, restaurar sesión, cerrar sesión y actualizar perfil.
 * Las pantallas nunca llaman a este módulo directamente, sino a través de AuthContext.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generarCodigoReferido } from '@/domain';
import { loginSchema, registroSchema, LoginInput, RegistroInput } from '@/schemas/auth';
import { perfilSchema, PerfilInput } from '@/schemas/perfil';
import { Usuaria, UsuariaConHash } from '@/types';
import { escribirDb, hashPassword, latencia, leerDb, nuevoId } from '@/data/localDb';
import { ServiceError } from './errores';

const CLAVE_SESION = 'bcn:sesion';
export const DURACION_SESION_HORAS = 8; // igual que el JWT de la web

interface SesionGuardada {
  usuariaId: string;
  expiraEn: number;
}

function sanitizar(u: UsuariaConHash): Usuaria {
  const { passwordHash: _omitido, ...publica } = u;
  return publica;
}

async function guardarSesion(usuariaId: string): Promise<void> {
  const sesion: SesionGuardada = {
    usuariaId,
    expiraEn: Date.now() + DURACION_SESION_HORAS * 60 * 60 * 1000,
  };
  await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export async function login(datos: LoginInput): Promise<Usuaria> {
  // La validación se repite aquí aunque la pantalla ya validó: segunda barrera.
  const parsed = loginSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);

  await latencia(700);
  const db = await leerDb();
  const correo = parsed.data.correo.toLowerCase();
  const usuaria = db.usuarias.find((u) => u.correo.toLowerCase() === correo);
  const hash = await hashPassword(correo, parsed.data.password);

  // Mismo mensaje para correo inexistente y contraseña incorrecta: no se revela cuál falló.
  if (!usuaria || usuaria.passwordHash !== hash) {
    throw new ServiceError('credenciales_invalidas', 'Correo o contraseña incorrectos');
  }

  await guardarSesion(usuaria.id);
  return sanitizar(usuaria);
}

export async function registro(datos: RegistroInput): Promise<Usuaria> {
  const parsed = registroSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);
  const d = parsed.data;

  await latencia(700);
  const db = await leerDb();
  const correo = d.correo.toLowerCase();

  if (db.usuarias.some((u) => u.correo.toLowerCase() === correo)) {
    throw new ServiceError('correo_duplicado', 'Ya existe una cuenta con ese correo');
  }
  if (d.codigoReferido && !db.usuarias.some((u) => u.codigoReferido === d.codigoReferido)) {
    throw new ServiceError('codigo_referido_invalido', 'El código de referido no existe');
  }

  const nueva: UsuariaConHash = {
    id: nuevoId('usr'),
    nombre: d.nombre.trim(),
    correo,
    telefono: d.telefono,
    rol: 'clienta', // el registro público nunca crea administradoras
    inasistencias: 0,
    codigoReferido: generarCodigoReferido(d.nombre, db.usuarias.map((u) => u.codigoReferido)),
    referidaPor: d.codigoReferido || undefined,
    creadaEn: new Date().toISOString(),
    passwordHash: await hashPassword(correo, d.password),
  };

  await escribirDb((db) => {
    db.usuarias.push(nueva);
  });
  await guardarSesion(nueva.id);
  return sanitizar(nueva);
}

/** Devuelve la usuaria de la sesión guardada, o null si no hay sesión o ya expiró. */
export async function restaurarSesion(): Promise<Usuaria | null> {
  const guardada = await AsyncStorage.getItem(CLAVE_SESION);
  if (!guardada) return null;

  const sesion = JSON.parse(guardada) as SesionGuardada;
  if (Date.now() > sesion.expiraEn) {
    await cerrarSesion();
    return null;
  }

  const db = await leerDb();
  const usuaria = db.usuarias.find((u) => u.id === sesion.usuariaId);
  return usuaria ? sanitizar(usuaria) : null;
}

export async function cerrarSesion(): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_SESION);
}

export async function actualizarPerfil(
  usuariaId: string,
  cambios: Partial<PerfilInput> & { fotoUri?: string }
): Promise<Usuaria> {
  const parsed = perfilSchema.partial().safeParse(cambios);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);

  await latencia(300);
  const db = await escribirDb((db) => {
    const u = db.usuarias.find((x) => x.id === usuariaId);
    if (!u) throw new ServiceError('no_encontrado', 'No se encontró la cuenta');
    const correo = parsed.data.correo?.toLowerCase();
    if (correo && db.usuarias.some((x) => x.id !== usuariaId && x.correo.toLowerCase() === correo)) {
      throw new ServiceError('correo_duplicado', 'Ya existe una cuenta con ese correo');
    }
    if (correo) u.correo = correo;
    if (parsed.data.telefono) u.telefono = parsed.data.telefono;
    if (cambios.fotoUri !== undefined) u.fotoUri = cambios.fotoUri;
  });
  return sanitizar(db.usuarias.find((u) => u.id === usuariaId)!);
}

/** Usuarias públicas, para calcular referidas. */
export async function listarUsuarias(): Promise<Usuaria[]> {
  const db = await leerDb();
  return db.usuarias.map(sanitizar);
}

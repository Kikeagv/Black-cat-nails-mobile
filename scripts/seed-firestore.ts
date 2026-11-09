/**
 * CARGA DE DATOS DE DEMOSTRACIÓN EN FIREBASE
 *
 * Crea las cuentas de prueba en Firebase Authentication (contraseña Password123)
 * y llena Firestore con el catálogo, el inventario, las citas y el historial.
 * Usa el SDK de administración (firebase-admin), que ignora las reglas de
 * seguridad: es la única forma de crear la cuenta de la administradora, porque
 * las reglas no dejan que nadie se asigne ese rol desde la app.
 *
 * Uso:
 *   npm run seed                 contra el proyecto real (necesita scripts/serviceAccount.json)
 *   npm run seed -- --reset      borra citas, agenda e historial antes de cargar
 *   npm run seed:emuladores      contra el Firebase Emulator Suite local
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { crearSeed, PASSWORD_DEMO } from '../src/data/seed';
import { ESTADOS_OCUPAN_AGENDA, formatoFechaHora, partesNegocio, ETIQUETAS_ESTADO } from '../src/domain';
import type { Cita } from '../src/types';

const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const reset = process.argv.includes('--reset');
const rutaCredencial = resolve(__dirname, 'serviceAccount.json');

function iniciar() {
  if (enEmulador) {
    const projectId = process.env.GCLOUD_PROJECT ?? 'demo-black-cat-nails';
    console.log(`→ Usando emuladores (proyecto ${projectId})`);
    return initializeApp({ projectId });
  }
  if (!existsSync(rutaCredencial)) {
    console.error(
      '✗ Falta scripts/serviceAccount.json.\n' +
        '  Consola de Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada,\n' +
        '  y guardá el archivo con ese nombre. Está en .gitignore: nunca lo subas a GitHub.'
    );
    process.exit(1);
  }
  const cuenta = JSON.parse(readFileSync(rutaCredencial, 'utf8'));
  console.log(`→ Proyecto ${cuenta.project_id}`);
  return initializeApp({ credential: cert(cuenta), projectId: cuenta.project_id });
}

const app = iniciar();
const auth = getAuth(app);
const db = getFirestore(app);

async function borrarColeccion(nombre: string) {
  await db.recursiveDelete(db.collection(nombre));
}

async function crearCuenta(u: { id: string; correo: string; nombre: string }) {
  try {
    await auth.getUser(u.id);
    await auth.updateUser(u.id, { email: u.correo, password: PASSWORD_DEMO, displayName: u.nombre });
  } catch {
    await auth.createUser({ uid: u.id, email: u.correo, password: PASSWORD_DEMO, displayName: u.nombre });
  }
}

async function main() {
  const seed = crearSeed();

  if (reset) {
    console.log('→ Borrando datos anteriores…');
    for (const c of ['citas', 'agendaDias', 'referidos', 'codigosReferido', 'usuarias', 'servicios', 'insumos']) {
      await borrarColeccion(c);
    }
  }

  console.log(`→ Cuentas en Authentication (${seed.usuarias.length})`);
  for (const u of seed.usuarias) await crearCuenta(u);

  const batch = db.batch();

  for (const { id, ...perfil } of seed.usuarias) {
    batch.set(db.doc(`usuarias/${id}`), { ...perfil, proveedor: 'password', actualizadaEn: FieldValue.serverTimestamp() });
    batch.set(db.doc(`codigosReferido/${perfil.codigoReferido}`), { uid: id });
    if (perfil.referidaPor) {
      batch.set(db.doc(`referidos/${id}`), {
        codigoReferente: perfil.referidaPor,
        nombre: perfil.nombre,
        creadaEn: perfil.creadaEn,
      });
    }
  }
  for (const { id, ...s } of seed.servicios) batch.set(db.doc(`servicios/${id}`), s);
  for (const { id, ...i } of seed.insumos) batch.set(db.doc(`insumos/${id}`), i);
  await batch.commit();
  console.log(`→ ${seed.servicios.length} servicios y ${seed.insumos.length} insumos`);

  // Citas + bloques de agenda por día + historial de actividad de cada clienta
  const dias = new Map<string, Record<string, { inicio: string; fin: string; uid: string }>>();
  const escritura = db.bulkWriter();
  for (const cita of seed.citas as Cita[]) {
    const fecha = partesNegocio(cita.inicio).ymd;
    const { id, ...datos } = cita;
    escritura.set(db.doc(`citas/${id}`), JSON.parse(JSON.stringify({ ...datos, fecha, inicioMs: Date.parse(cita.inicio) })));

    if (ESTADOS_OCUPAN_AGENDA.has(cita.estado)) {
      const bloques = dias.get(fecha) ?? {};
      bloques[id] = { inicio: cita.inicio, fin: cita.fin, uid: cita.clientaId };
      dias.set(fecha, bloques);
    }

    const actividad = db.collection(`usuarias/${cita.clientaId}/actividad`);
    escritura.create(actividad.doc(`seed_${id}_creada`), {
      tipo: 'cita_creada',
      descripcion: `Agendaste ${cita.servicios.map((s) => s.nombre).join(' + ')} para el ${formatoFechaHora(cita.inicio)}`,
      // Las citas futuras del seed se crean "ahora"; en el historial se muestran agendadas dos días antes.
      fecha: Timestamp.fromMillis(Math.min(Date.parse(cita.creadaEn), Date.now() - 2 * 24 * 60 * 60 * 1000)),
      citaId: id,
    });
    if (cita.estado !== 'confirmada' && cita.estado !== 'solicitada') {
      escritura.create(actividad.doc(`seed_${id}_estado`), {
        tipo: cita.estado === 'cancelada' ? 'cita_cancelada' : 'cita_estado',
        descripcion: `Tu cita del ${formatoFechaHora(cita.inicio)} pasó a "${ETIQUETAS_ESTADO[cita.estado]}"`,
        fecha: Timestamp.fromDate(new Date(cita.fin)),
        citaId: id,
      });
    }
  }
  for (const [fecha, bloques] of dias) {
    escritura.set(db.doc(`agendaDias/${fecha}`), { fecha, bloques, ultimaCita: Object.keys(bloques).at(-1) });
  }
  for (const u of seed.usuarias) {
    escritura.create(db.doc(`usuarias/${u.id}/actividad/seed_registro`), {
      tipo: 'registro',
      descripcion: u.referidaPor ? `Creaste tu cuenta con el código ${u.referidaPor}` : 'Creaste tu cuenta en Black Cat Nails',
      fecha: Timestamp.fromDate(new Date(u.creadaEn)),
    });
  }
  // Si el historial ya existía (sin --reset), se conservan los registros anteriores.
  escritura.onWriteError((err) => err.code !== 6 /* ALREADY_EXISTS */ && err.failedAttempts < 3);
  await escritura.close();

  console.log(`→ ${seed.citas.length} citas en ${dias.size} días con horarios ocupados`);
  console.log('\n✓ Listo. Cuentas de prueba (contraseña Password123):');
  for (const u of seed.usuarias) console.log(`   ${u.rol === 'admin' ? 'admin  ' : 'clienta'}  ${u.correo}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('✗', e);
  process.exit(1);
});

/**
 * PRUEBAS DE LAS REGLAS DE SEGURIDAD (Firestore Emulator)
 *
 * Simula a una clienta, a otra clienta y a la administradora e intenta tanto
 * operaciones permitidas como ataques típicos (darse rol de admin, leer citas
 * ajenas, borrar historial…). Cada caso debe pasar o fallar según lo esperado.
 *
 * Uso: con los emuladores corriendo (npm run emuladores), npm run test:reglas
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setLogLevel,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const HORA = 60 * 60 * 1000;
let env: RulesTestEnvironment;
let ok = 0;
let fallos = 0;

async function caso(nombre: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    ok++;
    console.log(`  ✓ ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`  ✗ ${nombre}\n      ${(e as Error).message.split('\n')[0]}`);
  }
}

const perfil = (nombre: string, correo: string, codigo: string, rol = 'clienta') => ({
  nombre,
  correo,
  telefono: '70001234',
  rol,
  inasistencias: 0,
  codigoReferido: codigo,
  creadaEn: new Date().toISOString(),
});

function cita(clientaId: string, inicioMs: number, estado = 'confirmada') {
  const inicio = new Date(inicioMs).toISOString();
  return {
    clientaId,
    clientaNombre: 'Prueba',
    servicios: [{ servicioId: 'srv_1', nombre: 'Manicura', precio: 15, duracionMin: 45 }],
    inicio,
    fin: new Date(inicioMs + HORA).toISOString(),
    duracionTotalMin: 60,
    montoTotal: 15,
    estado,
    creadaEn: new Date().toISOString(),
    fecha: inicio.slice(0, 10),
    inicioMs,
  };
}

async function main() {
  setLogLevel('silent'); // los PERMISSION_DENIED esperados no ensucian la salida
  env = await initializeTestEnvironment({
    projectId: 'demo-reglas',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
  await env.clearFirestore();

  const en3dias = Date.now() + 72 * HORA;
  const en2horas = Date.now() + 2 * HORA;
  const fecha3 = new Date(en3dias).toISOString().slice(0, 10);

  // Datos base, escritos sin reglas (como hace npm run seed)
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usuarias/ana'), { ...perfil('Ana Ruiz', 'ana@mail.com', 'ANA2026'), inasistencias: 2 });
    await setDoc(doc(db, 'usuarias/bea'), perfil('Bea Soto', 'bea@mail.com', 'BEA2026'));
    await setDoc(doc(db, 'usuarias/admin'), perfil('Valeria Vante', 'vante@mail.com', 'VALE2026', 'admin'));
    await setDoc(doc(db, 'codigosReferido/ANA2026'), { uid: 'ana' });
    await setDoc(doc(db, 'codigosReferido/BEA2026'), { uid: 'bea' });
    await setDoc(doc(db, 'referidos/bea'), { codigoReferente: 'ANA2026', nombre: 'Bea Soto', creadaEn: '2026-11-01' });
    await setDoc(doc(db, 'insumos/ins_1'), { nombre: 'Gel', unidad: 'ml', existencia: 100, minimo: 20, costo: 1 });
    await setDoc(doc(db, 'servicios/srv_1'), { nombre: 'Manicura', activo: true, precio: 15 });
    await setDoc(doc(db, 'citas/c_bea'), cita('bea', en3dias));
    await setDoc(doc(db, 'citas/c_ana_pronto'), cita('ana', en2horas));
    await setDoc(doc(db, 'citas/c_ana'), cita('ana', en3dias + 2 * HORA));
    await setDoc(doc(db, `agendaDias/${fecha3}`), {
      fecha: fecha3,
      bloques: { c_bea: { inicio: 'x', fin: 'y', uid: 'bea' }, c_ana: { inicio: 'x', fin: 'y', uid: 'ana' } },
      ultimaCita: 'c_ana',
    });
    await setDoc(doc(db, 'usuarias/ana/actividad/a1'), { tipo: 'registro', descripcion: 'x', fecha: Timestamp.now() });
  });

  const ana = env.authenticatedContext('ana', { email: 'ana@mail.com' }).firestore();
  const admin = env.authenticatedContext('admin', { email: 'vante@mail.com' }).firestore();
  const nueva = env.authenticatedContext('nueva', { email: 'nueva@mail.com' }).firestore();
  const anonima = env.unauthenticatedContext().firestore();

  console.log('\nPerfiles');
  await caso('una clienta lee su propio perfil', () => assertSucceeds(getDoc(doc(ana, 'usuarias/ana'))));
  await caso('una clienta NO lee el perfil de otra', () => assertFails(getDoc(doc(ana, 'usuarias/bea'))));
  await caso('la administradora lee cualquier perfil', () => assertSucceeds(getDoc(doc(admin, 'usuarias/bea'))));
  await caso('una clienta cambia su teléfono', () => assertSucceeds(updateDoc(doc(ana, 'usuarias/ana'), { telefono: '79998888' })));
  await caso('una clienta NO se asigna el rol admin', () => assertFails(updateDoc(doc(ana, 'usuarias/ana'), { rol: 'admin' })));
  await caso('una clienta NO se borra las inasistencias', () => assertFails(updateDoc(doc(ana, 'usuarias/ana'), { inasistencias: 0, telefono: '71112222' })));
  await caso('una clienta NO pone un teléfono inválido', () => assertFails(updateDoc(doc(ana, 'usuarias/ana'), { telefono: '123' })));

  console.log('\nRegistro');
  await caso('registro válido: perfil + código en un batch', () => {
    const b = writeBatch(nueva);
    b.set(doc(nueva, 'usuarias/nueva'), { ...perfil('Nueva Clienta', 'nueva@mail.com', 'NUEV2026'), referidaPor: 'ANA2026' });
    b.set(doc(nueva, 'codigosReferido/NUEV2026'), { uid: 'nueva' });
    b.set(doc(nueva, 'referidos/nueva'), { codigoReferente: 'ANA2026', nombre: 'Nueva Clienta', creadaEn: '2026-11-05' });
    return assertSucceeds(b.commit());
  });
  const intrusa = env.authenticatedContext('intrusa', { email: 'intrusa@mail.com' }).firestore();
  await caso('registro que se declara admin es rechazado', () => {
    const b = writeBatch(intrusa);
    b.set(doc(intrusa, 'usuarias/intrusa'), perfil('Intrusa', 'intrusa@mail.com', 'INTR2026', 'admin'));
    b.set(doc(intrusa, 'codigosReferido/INTR2026'), { uid: 'intrusa' });
    return assertFails(b.commit());
  });
  await caso('NO se puede adueñar de un código ajeno', () =>
    assertFails(setDoc(doc(intrusa, 'codigosReferido/ANA2026'), { uid: 'intrusa' }))
  );
  await caso('sin sesión se puede validar un código (get)', () => assertSucceeds(getDoc(doc(anonima, 'codigosReferido/ANA2026'))));
  await caso('sin sesión NO se listan los códigos', () => assertFails(getDocs(collection(anonima, 'codigosReferido'))));
  await caso('la referente ve a sus referidas', () =>
    assertSucceeds(getDocs(query(collection(ana, 'referidos'), where('codigoReferente', '==', 'ANA2026'))))
  );
  await caso('NO ve las referidas de otra', () =>
    assertFails(getDocs(query(collection(ana, 'referidos'), where('codigoReferente', '==', 'BEA2026'))))
  );

  console.log('\nCitas y agenda');
  await caso('una clienta lista solo sus citas', () =>
    assertSucceeds(getDocs(query(collection(ana, 'citas'), where('clientaId', '==', 'ana'))))
  );
  await caso('una clienta NO lista todas las citas', () => assertFails(getDocs(collection(ana, 'citas'))));
  await caso('una clienta NO lee una cita ajena', () => assertFails(getDoc(doc(ana, 'citas/c_bea'))));
  await caso('la administradora lista toda la agenda', () => assertSucceeds(getDocs(collection(admin, 'citas'))));
  await caso('cualquier usuaria lee la disponibilidad del día', () => assertSucceeds(getDoc(doc(ana, `agendaDias/${fecha3}`))));

  const inicioNueva = en3dias + 5 * HORA;
  await caso('crear cita + reservar su bloque (atómico)', () => {
    const b = writeBatch(ana);
    b.set(doc(ana, 'citas/c_nueva'), cita('ana', inicioNueva));
    b.set(doc(ana, `agendaDias/${fecha3}`), {
      fecha: fecha3,
      bloques: {
        c_bea: { inicio: 'x', fin: 'y', uid: 'bea' },
        c_ana: { inicio: 'x', fin: 'y', uid: 'ana' },
        c_nueva: { inicio: 'x', fin: 'y', uid: 'ana' },
      },
      ultimaCita: 'c_nueva',
    });
    return assertSucceeds(b.commit());
  });
  await caso('crear cita SIN reservar el bloque es rechazado', () =>
    assertFails(setDoc(doc(ana, 'citas/c_sin_bloque'), cita('ana', inicioNueva + HORA)))
  );
  await caso('crear cita a nombre de otra clienta es rechazado', () => {
    const b = writeBatch(ana);
    b.set(doc(ana, 'citas/c_falsa'), cita('bea', inicioNueva + 2 * HORA));
    return assertFails(b.commit());
  });
  await caso('NO se puede borrar el bloque de otra clienta', () =>
    assertFails(
      setDoc(doc(ana, `agendaDias/${fecha3}`), {
        fecha: fecha3,
        bloques: { c_ana: { inicio: 'x', fin: 'y', uid: 'ana' }, c_nueva: { inicio: 'x', fin: 'y', uid: 'ana' } },
        ultimaCita: 'c_bea',
      })
    )
  );
  await caso('una clienta cancela su cita con más de 12 h', () => {
    const b = writeBatch(ana);
    b.update(doc(ana, 'citas/c_ana'), { estado: 'cancelada', actualizadaEn: serverTimestamp() });
    b.set(doc(ana, `agendaDias/${fecha3}`), {
      fecha: fecha3,
      bloques: { c_bea: { inicio: 'x', fin: 'y', uid: 'bea' }, c_nueva: { inicio: 'x', fin: 'y', uid: 'ana' } },
      ultimaCita: 'c_ana',
    });
    return assertSucceeds(b.commit());
  });
  await caso('NO cancela con menos de 12 h de anticipación', () =>
    assertFails(updateDoc(doc(ana, 'citas/c_ana_pronto'), { estado: 'cancelada' }))
  );
  await caso('una clienta NO se marca su cita como completada', () =>
    assertFails(updateDoc(doc(ana, 'citas/c_nueva'), { estado: 'completada' }))
  );
  await caso('la administradora confirma y completa citas', () =>
    assertSucceeds(updateDoc(doc(admin, 'citas/c_bea'), { estado: 'en_curso' }))
  );
  await caso('nadie borra citas', () => assertFails(deleteDoc(doc(admin, 'citas/c_bea'))));

  console.log('\nInventario, catálogo e historial');
  await caso('una clienta NO ve el inventario', () => assertFails(getDocs(collection(ana, 'insumos'))));
  await caso('la administradora ve y ajusta el inventario', () =>
    assertSucceeds(updateDoc(doc(admin, 'insumos/ins_1'), { existencia: 90 }))
  );
  await caso('una clienta lee el catálogo de servicios', () => assertSucceeds(getDocs(collection(ana, 'servicios'))));
  await caso('una clienta NO cambia precios', () => assertFails(updateDoc(doc(ana, 'servicios/srv_1'), { precio: 1 })));
  await caso('se agrega un registro al historial con hora del servidor', () =>
    assertSucceeds(
      setDoc(doc(ana, 'usuarias/ana/actividad/a2'), { tipo: 'inicio_sesion', descripcion: 'Entró', fecha: serverTimestamp() })
    )
  );
  await caso('NO se falsea la fecha de un registro', () =>
    assertFails(
      setDoc(doc(ana, 'usuarias/ana/actividad/a3'), { tipo: 'inicio_sesion', descripcion: 'x', fecha: Timestamp.fromMillis(0) })
    )
  );
  await caso('el historial NO se edita ni se borra', () => assertFails(deleteDoc(doc(ana, 'usuarias/ana/actividad/a1'))));
  await caso('una clienta NO lee el historial de otra', () => assertFails(getDocs(collection(ana, 'usuarias/bea/actividad'))));
  await caso('favoritos propios: guardar y quitar', async () => {
    await assertSucceeds(setDoc(doc(ana, 'usuarias/ana/favoritos/dis_1'), { nombre: 'Gótico', creadoEn: serverTimestamp() }));
    await assertSucceeds(deleteDoc(doc(ana, 'usuarias/ana/favoritos/dis_1')));
  });

  await env.cleanup();
  console.log(`\n${ok} casos correctos, ${fallos} con error`);
  process.exit(fallos ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

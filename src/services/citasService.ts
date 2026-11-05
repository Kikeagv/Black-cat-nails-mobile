/**
 * SERVICIO DE CITAS — Cloud Firestore
 *
 * Igual que los Route Handlers de la web, vuelve a validar todo antes de
 * escribir. Las operaciones que tocan varios documentos usan transacciones
 * (runTransaction) para que dos clientas no tomen el mismo horario y para que
 * completar una cita descuente insumos de forma atómica.
 *
 * Disponibilidad sin exponer datos personales: una clienta no puede leer citas
 * ajenas, así que cada día tiene un documento agendaDias/{fecha} con los
 * bloques ocupados (inicio, fin y uid), sin nombres ni servicios.
 */

import {
  DocumentSnapshot,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  calcularConsumo,
  calcularFechaRetoque,
  calcularHorarios,
  construirCita,
  ETIQUETAS_ESTADO,
  formatoFechaHora,
  partesNegocio,
  resumirSeleccion,
  validarTransicionEstado,
} from '@/domain';
import { crearCitaSchema, CrearCitaInput } from '@/schemas/cita';
import { BloqueAgenda, Cita, EstadoCita, HorarioDisponible, Servicio, Usuaria } from '@/types';
import * as actividad from './actividadService';
import { conFirebase, ServiceError, traducirErrorFirebase } from './errores';
import { obtenerDb } from './firebase/app';
import { colCitas, refAgendaDia, refCita, refInsumo, refServicio, refUsuaria, sinId } from './firebase/colecciones';

const ordenarPorInicio = (a: Cita, b: Cita) => a.inicio.localeCompare(b.inicio);

const aCita = (snap: DocumentSnapshot): Cita => ({ id: snap.id, ...snap.data() }) as Cita;

function bloquesDe(snap: DocumentSnapshot): Record<string, BloqueAgenda> {
  return (snap.exists() ? snap.data().bloques : {}) ?? {};
}

/** Citas de la clienta en tiempo real (la consulta coincide con lo que permiten las reglas). */
export function observarCitasDeClienta(
  clientaId: string,
  alCambiar: (citas: Cita[]) => void,
  alFallar: (mensaje: string) => void
): () => void {
  return onSnapshot(
    query(colCitas(), where('clientaId', '==', clientaId)),
    (snap) => alCambiar(snap.docs.map(aCita).sort(ordenarPorInicio)),
    (e) => alFallar(traducirErrorFirebase(e).message)
  );
}

/** Toda la agenda (solo administradora; las reglas rechazan a una clienta). */
export function observarTodas(
  usuaria: Usuaria,
  alCambiar: (citas: Cita[]) => void,
  alFallar: (mensaje: string) => void
): () => void {
  if (usuaria.rol !== 'admin') {
    alFallar('Solo la administradora puede ver la agenda completa');
    return () => {};
  }
  return onSnapshot(
    query(colCitas(), orderBy('inicio')),
    (snap) => alCambiar(snap.docs.map(aCita)),
    (e) => alFallar(traducirErrorFirebase(e).message)
  );
}

/** Horarios de una fecha según la duración pedida y los bloques ocupados de ese día. */
export async function consultarDisponibilidad(fecha: string, duracionTotalMin: number): Promise<HorarioDisponible[]> {
  const snap = await conFirebase(() => getDoc(refAgendaDia(fecha)));
  return calcularHorarios(fecha, duracionTotalMin, Object.values(bloquesDe(snap)));
}

export async function crearCita(usuaria: Usuaria, datos: CrearCitaInput): Promise<Cita> {
  const parsed = crearCitaSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);

  // Precios y duraciones se leen del servidor, no de lo que mandó la pantalla.
  const snaps = await conFirebase(() => Promise.all(parsed.data.servicioIds.map((id) => getDoc(refServicio(id)))));
  const servicios = snaps.map((s) => (s.exists() && s.data().activo ? ({ id: s.id, ...s.data() } as Servicio) : null));
  if (servicios.some((s) => !s)) {
    throw new ServiceError('no_encontrado', 'Uno de los servicios ya no está disponible');
  }

  const { ymd, hora } = partesNegocio(parsed.data.inicio);
  const { duracionTotalMin } = resumirSeleccion(servicios as Servicio[]);
  const refNueva = doc(colCitas());

  const cita = construirCita({
    id: refNueva.id,
    clientaId: usuaria.id,
    clientaNombre: usuaria.nombre,
    servicios: servicios as Servicio[],
    fecha: ymd,
    hora,
    notas: parsed.data.notas,
    imagenReferenciaUri: parsed.data.imagenReferenciaUri,
  });
  const conCampos: Cita = { ...cita, fecha: ymd, inicioMs: Date.parse(cita.inicio) };

  await conFirebase(() =>
    runTransaction(obtenerDb(), async (tx) => {
      const dia = await tx.get(refAgendaDia(ymd));
      const bloques = bloquesDe(dia);
      // Revalidación dentro de la transacción: si otra clienta tomó el horario
      // mientras esta elegía, Firestore reintenta y aquí se detecta el choque.
      const bloque = calcularHorarios(ymd, duracionTotalMin, Object.values(bloques)).find((h) => h.hora === hora);
      if (!bloque?.disponible) {
        throw new ServiceError('horario_no_disponible', 'Ese horario acaba de ocuparse. Elegí otro.');
      }
      tx.set(refNueva, { ...sinId(conCampos), actualizadaEn: serverTimestamp() });
      tx.set(refAgendaDia(ymd), {
        fecha: ymd,
        bloques: { ...bloques, [cita.id]: { inicio: cita.inicio, fin: cita.fin, uid: usuaria.id } },
        ultimaCita: cita.id,
      });
    })
  );

  actividad.registrar(
    usuaria.id,
    'cita_creada',
    `Agendaste ${cita.servicios.map((s) => s.nombre).join(' + ')} para el ${formatoFechaHora(cita.inicio)}`,
    cita.id
  );
  return conCampos;
}

/** Estados que liberan el bloque en agendaDias. */
const LIBERAN_AGENDA: EstadoCita[] = ['cancelada', 'inasistencia'];

/**
 * Cambia el estado de una cita aplicando la máquina de estados compartida con la web
 * y los efectos de negocio: contador de inasistencias, retoque y descuento de insumos.
 * Todo ocurre en una transacción: o se guardan todos los cambios o ninguno.
 */
export async function cambiarEstado(usuaria: Usuaria, citaId: string, hacia: EstadoCita): Promise<Cita> {
  const actualizada = await conFirebase(() =>
    runTransaction(obtenerDb(), async (tx) => {
      // 1. Lecturas (Firestore exige leer todo antes de escribir)
      const snap = await tx.get(refCita(citaId));
      if (!snap.exists()) throw new ServiceError('no_encontrado', 'La cita no existe');
      const cita = aCita(snap);
      if (usuaria.rol === 'clienta' && cita.clientaId !== usuaria.id) {
        throw new ServiceError('permiso_insuficiente', 'No podés modificar citas de otra clienta');
      }
      const v = validarTransicionEstado(cita.estado, hacia, usuaria.rol, cita.inicio);
      if (!v.valida) throw new ServiceError(v.codigo ?? 'transicion_invalida', v.mensaje ?? 'Cambio no permitido');

      const fecha = cita.fecha ?? partesNegocio(cita.inicio).ymd;
      const dia = LIBERAN_AGENDA.includes(hacia) ? await tx.get(refAgendaDia(fecha)) : null;

      let cambios: Partial<Cita> = { estado: hacia };
      let descuentos: { ref: ReturnType<typeof refInsumo>; existencia: number }[] = [];

      if (hacia === 'completada') {
        const servSnaps = await Promise.all(cita.servicios.map((s) => tx.get(refServicio(s.servicioId))));
        const servicios = servSnaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }) as Servicio);
        const consumo = calcularConsumo(servicios);
        const insumoSnaps = await Promise.all(consumo.map((c) => tx.get(refInsumo(c.insumoId))));
        descuentos = insumoSnaps
          .filter((s) => s.exists())
          .map((s) => {
            const c = consumo.find((x) => x.insumoId === s.id)!;
            return { ref: refInsumo(s.id), existencia: Math.max(0, Number((s.data()!.existencia - c.cantidad).toFixed(2))) };
          });
        cambios = {
          ...cambios,
          insumosDescontados: consumo,
          montoCobrado: cita.montoTotal,
          fechaRetoque: calcularFechaRetoque(cita.inicio, servicios),
        };
      }

      // 2. Escrituras
      tx.update(refCita(citaId), { ...JSON.parse(JSON.stringify(cambios)), actualizadaEn: serverTimestamp() });
      if (dia) {
        const { [citaId]: _liberado, ...resto } = bloquesDe(dia);
        tx.set(refAgendaDia(fecha), { fecha, bloques: resto, ultimaCita: citaId });
      }
      if (hacia === 'inasistencia') tx.update(refUsuaria(cita.clientaId), { inasistencias: increment(1) });
      descuentos.forEach((d) => tx.update(d.ref, { existencia: d.existencia }));

      return { ...cita, ...cambios };
    })
  );

  const cuando = formatoFechaHora(actualizada.inicio);
  if (usuaria.rol === 'clienta') {
    actividad.registrar(usuaria.id, 'cita_cancelada', `Cancelaste tu cita del ${cuando}`, citaId);
  } else {
    actividad.registrar(
      actualizada.clientaId,
      'cita_estado',
      `Tu cita del ${cuando} pasó a "${ETIQUETAS_ESTADO[hacia]}"`,
      citaId
    );
  }
  return actualizada;
}

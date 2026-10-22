/**
 * SERVICIO DE CITAS (capa de datos)
 *
 * Igual que los Route Handlers de la web, vuelve a validar todo antes de
 * escribir: disponibilidad real al crear y máquina de estados al cambiar estado.
 */

import {
  calcularConsumo,
  calcularFechaRetoque,
  calcularHorarios,
  construirCita,
  partesNegocio,
  resumirSeleccion,
  validarTransicionEstado,
} from '@/domain';
import { crearCitaSchema, CrearCitaInput } from '@/schemas/cita';
import { Cita, EstadoCita, HorarioDisponible, Usuaria } from '@/types';
import { escribirDb, latencia, leerDb, nuevoId } from '@/data/localDb';
import { ServiceError } from './errores';

const ordenarPorInicio = (a: Cita, b: Cita) => a.inicio.localeCompare(b.inicio);

export async function listarCitasDeClienta(clientaId: string): Promise<Cita[]> {
  await latencia(400);
  const db = await leerDb();
  return db.citas.filter((c) => c.clientaId === clientaId).sort(ordenarPorInicio);
}

/** Todas las citas (solo administradora). */
export async function listarTodas(usuaria: Usuaria): Promise<Cita[]> {
  if (usuaria.rol !== 'admin') {
    throw new ServiceError('permiso_insuficiente', 'Solo la administradora puede ver la agenda completa');
  }
  await latencia(400);
  const db = await leerDb();
  return [...db.citas].sort(ordenarPorInicio);
}

/** Horarios para una fecha según la duración pedida y la agenda de TODAS las clientas. */
export async function consultarDisponibilidad(
  fecha: string,
  duracionTotalMin: number
): Promise<HorarioDisponible[]> {
  await latencia(300);
  const db = await leerDb();
  const delDia = db.citas.filter((c) => partesNegocio(c.inicio).ymd === fecha);
  return calcularHorarios(fecha, duracionTotalMin, delDia);
}

export async function crearCita(usuaria: Usuaria, datos: CrearCitaInput): Promise<Cita> {
  const parsed = crearCitaSchema.safeParse(datos);
  if (!parsed.success) throw new ServiceError('validacion', parsed.error.issues[0].message);

  await latencia(600);
  const db = await leerDb();
  const servicios = parsed.data.servicioIds.map((id) => db.servicios.find((s) => s.id === id && s.activo));
  if (servicios.some((s) => !s)) {
    throw new ServiceError('no_encontrado', 'Uno de los servicios ya no está disponible');
  }

  const { ymd, hora } = partesNegocio(parsed.data.inicio);
  const { duracionTotalMin } = resumirSeleccion(servicios as NonNullable<(typeof servicios)[number]>[]);

  // Revalidación: otra clienta pudo tomar el horario mientras esta elegía.
  const delDia = db.citas.filter((c) => partesNegocio(c.inicio).ymd === ymd);
  const bloque = calcularHorarios(ymd, duracionTotalMin, delDia).find((h) => h.hora === hora);
  if (!bloque?.disponible) {
    throw new ServiceError('horario_no_disponible', 'Ese horario acaba de ocuparse. Elegí otro.');
  }

  const cita = construirCita({
    id: nuevoId('cit'),
    clientaId: usuaria.id,
    clientaNombre: usuaria.nombre,
    servicios: servicios as NonNullable<(typeof servicios)[number]>[],
    fecha: ymd,
    hora,
    notas: parsed.data.notas,
    imagenReferenciaUri: parsed.data.imagenReferenciaUri,
  });

  await escribirDb((db) => {
    db.citas.push(cita);
  });
  return cita;
}

/**
 * Cambia el estado de una cita aplicando la máquina de estados compartida con la web
 * y los efectos de negocio: contador de inasistencias, retoque y descuento de insumos.
 */
export async function cambiarEstado(usuaria: Usuaria, citaId: string, hacia: EstadoCita): Promise<Cita> {
  await latencia(450);
  let actualizada: Cita | undefined;

  await escribirDb((db) => {
    const cita = db.citas.find((c) => c.id === citaId);
    if (!cita) throw new ServiceError('no_encontrado', 'La cita no existe');
    if (usuaria.rol === 'clienta' && cita.clientaId !== usuaria.id) {
      throw new ServiceError('permiso_insuficiente', 'No podés modificar citas de otra clienta');
    }

    const v = validarTransicionEstado(cita.estado, hacia, usuaria.rol, cita.inicio);
    if (!v.valida) throw new ServiceError(v.codigo ?? 'transicion_invalida', v.mensaje ?? 'Cambio no permitido');

    cita.estado = hacia;

    if (hacia === 'inasistencia') {
      const clienta = db.usuarias.find((u) => u.id === cita.clientaId);
      if (clienta) clienta.inasistencias += 1;
    }

    if (hacia === 'completada') {
      const servicios = cita.servicios
        .map((s) => db.servicios.find((x) => x.id === s.servicioId))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      const consumo = calcularConsumo(servicios);
      consumo.forEach((c) => {
        const insumo = db.insumos.find((i) => i.id === c.insumoId);
        if (insumo) insumo.existencia = Math.max(0, insumo.existencia - c.cantidad);
      });
      cita.insumosDescontados = consumo;
      cita.montoCobrado = cita.montoTotal;
      cita.fechaRetoque = calcularFechaRetoque(cita.inicio, servicios);
    }

    actualizada = { ...cita };
  });

  return actualizada!;
}

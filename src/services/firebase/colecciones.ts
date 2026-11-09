/**
 * Referencias a las colecciones de Cloud Firestore.
 *
 * Modelo de datos (detallado en docs/firebase.md):
 *
 *   usuarias/{uid}                    perfil, rol y contador de inasistencias
 *     ├─ favoritos/{disenoId}         diseños guardados por la clienta
 *     └─ actividad/{id}               historial de acciones (registro, citas, perfil…)
 *   codigosReferido/{codigo}          índice de códigos únicos → uid
 *   referidos/{uidNueva}              quién se registró con qué código
 *   servicios/{id}                    catálogo (solo lectura para clientas)
 *   insumos/{id}                      inventario (solo administradora)
 *   citas/{id}                        citas; clientaId = uid de la dueña
 *   agendaDias/{YYYY-MM-DD}           bloques ocupados del día, sin datos personales
 */

import { collection, doc } from 'firebase/firestore';
import { obtenerDb } from './app';

export const COL = {
  usuarias: 'usuarias',
  favoritos: 'favoritos',
  actividad: 'actividad',
  codigosReferido: 'codigosReferido',
  referidos: 'referidos',
  servicios: 'servicios',
  insumos: 'insumos',
  citas: 'citas',
  agendaDias: 'agendaDias',
} as const;

export const refUsuaria = (uid: string) => doc(obtenerDb(), COL.usuarias, uid);
export const refFavoritos = (uid: string) => collection(obtenerDb(), COL.usuarias, uid, COL.favoritos);
export const refActividad = (uid: string) => collection(obtenerDb(), COL.usuarias, uid, COL.actividad);
export const refCodigo = (codigo: string) => doc(obtenerDb(), COL.codigosReferido, codigo);
export const refReferido = (uid: string) => doc(obtenerDb(), COL.referidos, uid);
export const colReferidos = () => collection(obtenerDb(), COL.referidos);
export const colServicios = () => collection(obtenerDb(), COL.servicios);
export const refServicio = (id: string) => doc(obtenerDb(), COL.servicios, id);
export const colInsumos = () => collection(obtenerDb(), COL.insumos);
export const refInsumo = (id: string) => doc(obtenerDb(), COL.insumos, id);
export const colCitas = () => collection(obtenerDb(), COL.citas);
export const refCita = (id: string) => doc(obtenerDb(), COL.citas, id);
export const refAgendaDia = (fecha: string) => doc(obtenerDb(), COL.agendaDias, fecha);

/** Quita `undefined` (Firestore no los acepta) y el id, que ya es la clave del documento. */
export function sinId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  const { id: _id, ...resto } = obj;
  return JSON.parse(JSON.stringify(resto));
}

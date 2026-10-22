/**
 * SERVICIO DE CATÁLOGO (capa de datos): servicios activos y galería de diseños.
 */

import { DISENOS } from '@/data/disenos';
import { latencia, leerDb } from '@/data/localDb';
import { Diseno, Servicio } from '@/types';

export async function listarServicios(): Promise<Servicio[]> {
  await latencia(350);
  const db = await leerDb();
  return db.servicios.filter((s) => s.activo);
}

export async function listarDisenos(): Promise<Diseno[]> {
  await latencia(350);
  return DISENOS;
}

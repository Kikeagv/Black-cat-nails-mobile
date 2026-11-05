/**
 * SERVICIO DE CATÁLOGO
 *
 * - Servicios: colección `servicios` de Firestore (los administra la dueña).
 * - Galería de diseños: queda local porque las fotos van empaquetadas en la app.
 * - Favoritos: subcolección usuarias/{uid}/favoritos, así se conservan al
 *   cambiar de teléfono o entrar desde la web.
 */

import { deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { DISENOS } from '@/data/disenos';
import { Diseno, Servicio } from '@/types';
import * as actividad from './actividadService';
import { conFirebase, traducirErrorFirebase } from './errores';
import { colServicios, refFavoritos } from './firebase/colecciones';

export async function listarServicios(): Promise<Servicio[]> {
  const snap = await conFirebase(() => getDocs(query(colServicios(), where('activo', '==', true))));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Servicio)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export async function listarDisenos(): Promise<Diseno[]> {
  return DISENOS;
}

export function observarFavoritos(
  uid: string,
  alCambiar: (ids: string[]) => void,
  alFallar: (mensaje: string) => void
): () => void {
  return onSnapshot(
    refFavoritos(uid),
    (snap) => alCambiar(snap.docs.map((d) => d.id)),
    (e) => alFallar(traducirErrorFirebase(e).message)
  );
}

export async function alternarFavorito(uid: string, diseno: Pick<Diseno, 'id' | 'nombre'>, marcar: boolean) {
  const ref = doc(refFavoritos(uid), diseno.id);
  if (marcar) {
    await conFirebase(() => setDoc(ref, { nombre: diseno.nombre, creadoEn: serverTimestamp() }));
    actividad.registrar(uid, 'favorito_agregado', `Guardaste el diseño ${diseno.nombre}`);
  } else {
    await conFirebase(() => deleteDoc(ref));
  }
}

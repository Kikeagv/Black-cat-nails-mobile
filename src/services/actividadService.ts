/**
 * HISTORIAL DE ACTIVIDAD (Firestore: usuarias/{uid}/actividad)
 *
 * Cada acción importante (registro, inicio de sesión, cita creada o cancelada,
 * cambios de perfil) deja un registro con la hora del servidor. La clienta lo
 * ve en "Mi actividad" y se actualiza en tiempo real con onSnapshot.
 */

import { addDoc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Actividad, TipoActividad } from '@/types';
import { traducirErrorFirebase } from './errores';
import { refActividad } from './firebase/colecciones';

/** Guarda un registro. No bloquea ni rompe el flujo principal si falla. */
export function registrar(uid: string, tipo: TipoActividad, descripcion: string, citaId?: string): void {
  addDoc(refActividad(uid), {
    tipo,
    descripcion,
    fecha: serverTimestamp(),
    ...(citaId ? { citaId } : {}),
  }).catch((e) => {
    if (__DEV__) console.warn('[actividad] no se pudo registrar', e);
  });
}

/** Escucha los últimos registros de la usuaria, del más reciente al más antiguo. */
export function observar(
  uid: string,
  alCambiar: (lista: Actividad[]) => void,
  alFallar: (mensaje: string) => void,
  maximo = 60
): () => void {
  const q = query(refActividad(uid), orderBy('fecha', 'desc'), limit(maximo));
  return onSnapshot(
    q,
    { includeMetadataChanges: false },
    (snap) =>
      alCambiar(
        snap.docs.map((d) => {
          const datos = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            tipo: datos.tipo,
            descripcion: datos.descripcion,
            citaId: datos.citaId,
            fecha: (datos.fecha as Timestamp | null)?.toDate().toISOString() ?? new Date().toISOString(),
          };
        })
      ),
    (e) => alFallar(traducirErrorFirebase(e).message)
  );
}

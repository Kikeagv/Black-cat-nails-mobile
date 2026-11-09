/**
 * SERVICIO DE INVENTARIO (solo administradora)
 *
 * Escucha la colección `insumos` en tiempo real: cuando la administradora
 * completa una cita, la transacción descuenta los insumos y esta lista se
 * actualiza sola. Las reglas de Firestore bloquean la lectura a las clientas.
 */

import { onSnapshot, orderBy, query } from 'firebase/firestore';
import { calcularEstado } from '@/domain';
import { Insumo } from '@/types';
import { traducirErrorFirebase } from './errores';
import { colInsumos } from './firebase/colecciones';

export function observarInsumos(
  alCambiar: (insumos: Insumo[]) => void,
  alFallar: (mensaje: string) => void
): () => void {
  return onSnapshot(
    query(colInsumos(), orderBy('nombre')),
    (snap) =>
      alCambiar(
        snap.docs.map((d) => {
          const insumo = { id: d.id, ...d.data() } as Insumo;
          return { ...insumo, estado: calcularEstado(insumo) };
        })
      ),
    (e) => alFallar(traducirErrorFirebase(e).message)
  );
}

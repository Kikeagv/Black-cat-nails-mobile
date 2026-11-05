import { useCallback, useEffect, useState } from 'react';
import { actividadService } from '@/services';
import { Actividad } from '@/types';

/** Historial de actividad en tiempo real de la usuaria indicada. */
export function useActividad(uid: string | undefined) {
  const [registros, setRegistros] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!uid) return;
    setCargando(true);
    setError(null);
    return actividadService.observar(
      uid,
      (lista) => {
        setRegistros(lista);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
  }, [uid, version]);

  const reintentar = useCallback(() => setVersion((v) => v + 1), []);
  return { registros, cargando, error, reintentar };
}

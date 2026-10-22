/**
 * AgendaContext — citas de la usuaria y borrador del agendamiento.
 *
 * El borrador guarda lo que la clienta va eligiendo en los pasos 1 a 3 para que
 * cada pantalla del flujo lea y escriba el mismo estado sin pasarlo por parámetros.
 */

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { citasService, mensajeDeError } from '@/services';
import { Cita, EstadoCita } from '@/types';
import { useAuth } from './AuthContext';

export interface BorradorCita {
  servicioIds: string[];
  fecha: string | null;
  hora: string | null;
  notas: string;
  imagenReferenciaUri?: string;
}

const BORRADOR_VACIO: BorradorCita = { servicioIds: [], fecha: null, hora: null, notas: '' };

interface AgendaContextValue {
  citas: Cita[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  borrador: BorradorCita;
  actualizarBorrador: (cambios: Partial<BorradorCita>) => void;
  reiniciarBorrador: (servicioIds?: string[]) => void;
  confirmarBorrador: () => Promise<Cita>;
  cambiarEstado: (citaId: string, estado: EstadoCita) => Promise<void>;
}

const AgendaContext = createContext<AgendaContextValue | null>(null);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { usuaria } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<BorradorCita>(BORRADOR_VACIO);

  const recargar = useCallback(async () => {
    if (!usuaria) return;
    setCargando(true);
    setError(null);
    try {
      // La administradora ve toda la agenda; la clienta solo sus citas.
      const lista =
        usuaria.rol === 'admin'
          ? await citasService.listarTodas(usuaria)
          : await citasService.listarCitasDeClienta(usuaria.id);
      setCitas(lista);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [usuaria]);

  useEffect(() => {
    if (usuaria) recargar();
    else {
      setCitas([]);
      setBorrador(BORRADOR_VACIO);
    }
  }, [usuaria, recargar]);

  const actualizarBorrador = useCallback((cambios: Partial<BorradorCita>) => {
    setBorrador((prev) => ({ ...prev, ...cambios }));
  }, []);

  const reiniciarBorrador = useCallback((servicioIds: string[] = []) => {
    setBorrador({ ...BORRADOR_VACIO, servicioIds });
  }, []);

  const confirmarBorrador = useCallback(async () => {
    if (!usuaria || !borrador.fecha || !borrador.hora) {
      throw new Error('Borrador incompleto');
    }
    const cita = await citasService.crearCita(usuaria, {
      servicioIds: borrador.servicioIds,
      inicio: `${borrador.fecha}T${borrador.hora}:00-06:00`,
      notas: borrador.notas,
      imagenReferenciaUri: borrador.imagenReferenciaUri,
    });
    // Actualización dinámica: la nueva cita aparece sin recargar toda la lista.
    setCitas((prev) => [...prev, cita].sort((a, b) => a.inicio.localeCompare(b.inicio)));
    return cita;
  }, [usuaria, borrador]);

  const cambiarEstado = useCallback(
    async (citaId: string, estado: EstadoCita) => {
      if (!usuaria) return;
      const actualizada = await citasService.cambiarEstado(usuaria, citaId, estado);
      setCitas((prev) => prev.map((c) => (c.id === citaId ? actualizada : c)));
    },
    [usuaria]
  );

  const value = useMemo(
    () => ({
      citas,
      cargando,
      error,
      recargar,
      borrador,
      actualizarBorrador,
      reiniciarBorrador,
      confirmarBorrador,
      cambiarEstado,
    }),
    [citas, cargando, error, recargar, borrador, actualizarBorrador, reiniciarBorrador, confirmarBorrador, cambiarEstado]
  );

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
}

export function useAgenda(): AgendaContextValue {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error('useAgenda debe usarse dentro de AgendaProvider');
  return ctx;
}

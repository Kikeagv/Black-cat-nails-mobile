/**
 * CatalogoContext — servicios activos (Firestore), galería de diseños y favoritos.
 *
 * Los favoritos viven en usuarias/{uid}/favoritos y se escuchan en tiempo real.
 * Al tocar el corazón se actualiza la interfaz de inmediato (optimista) y, si
 * Firestore rechaza la escritura, se revierte.
 *
 * Separado de la agenda para que marcar un favorito no redibuje las pantallas
 * de citas (decisión de providers desacoplados de la Etapa 1).
 */

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { catalogoService, mensajeDeError } from '@/services';
import { avisar } from '@/utils/dialogos';
import { Diseno, Servicio } from '@/types';
import { useAuth } from './AuthContext';

interface CatalogoContextValue {
  servicios: Servicio[];
  disenos: Diseno[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  favoritos: string[];
  alternarFavorito: (disenoId: string) => void;
}

const CatalogoContext = createContext<CatalogoContextValue | null>(null);

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { usuaria } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [disenos, setDisenos] = useState<Diseno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);

  const uid = usuaria?.id;

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [s, d] = await Promise.all([catalogoService.listarServicios(), catalogoService.listarDisenos()]);
      setServicios(s);
      setDisenos(d);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (uid) recargar();
  }, [uid, recargar]);

  // Los favoritos son por usuaria y se sincronizan con Firestore.
  useEffect(() => {
    if (!uid) return setFavoritos([]);
    return catalogoService.observarFavoritos(uid, setFavoritos, (m) => setError(m));
  }, [uid]);

  const alternarFavorito = useCallback(
    (disenoId: string) => {
      if (!uid) return;
      const diseno = disenos.find((d) => d.id === disenoId);
      if (!diseno) return;
      const marcar = !favoritos.includes(disenoId);
      setFavoritos((prev) => (marcar ? [...prev, disenoId] : prev.filter((id) => id !== disenoId)));
      catalogoService.alternarFavorito(uid, diseno, marcar).catch((e) => {
        setFavoritos((prev) => (marcar ? prev.filter((id) => id !== disenoId) : [...prev, disenoId]));
        avisar('No se pudo guardar', mensajeDeError(e));
      });
    },
    [uid, disenos, favoritos]
  );

  const value = useMemo(
    () => ({ servicios, disenos, cargando, error, recargar, favoritos, alternarFavorito }),
    [servicios, disenos, cargando, error, recargar, favoritos, alternarFavorito]
  );

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>;
}

export function useCatalogo(): CatalogoContextValue {
  const ctx = useContext(CatalogoContext);
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider');
  return ctx;
}

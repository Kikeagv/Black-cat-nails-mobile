/**
 * CatalogoContext — servicios activos, galería de diseños y favoritos.
 *
 * Separado de la agenda para que marcar un favorito no redibuje las pantallas
 * de citas (decisión de providers desacoplados de la Etapa 1).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { catalogoService, mensajeDeError } from '@/services';
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

  const claveFavoritos = usuaria ? `bcn:favoritos:${usuaria.id}` : null;

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
    if (usuaria) recargar();
  }, [usuaria, recargar]);

  // Los favoritos son por usuaria y se guardan en el dispositivo.
  useEffect(() => {
    if (!claveFavoritos) return setFavoritos([]);
    AsyncStorage.getItem(claveFavoritos).then((v) => setFavoritos(v ? JSON.parse(v) : []));
  }, [claveFavoritos]);

  const alternarFavorito = useCallback(
    (disenoId: string) => {
      setFavoritos((prev) => {
        const next = prev.includes(disenoId) ? prev.filter((id) => id !== disenoId) : [...prev, disenoId];
        if (claveFavoritos) AsyncStorage.setItem(claveFavoritos, JSON.stringify(next));
        return next;
      });
    },
    [claveFavoritos]
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

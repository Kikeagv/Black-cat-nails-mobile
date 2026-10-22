/**
 * AuthContext — estado global de la sesión.
 *
 * Es la única puerta de la interfaz hacia `authService`. Al montar la app
 * intenta restaurar la sesión guardada (si no expiró) y expone el rol, que el
 * navegador raíz usa para decidir qué pantallas mostrar.
 */

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services';
import { LoginInput, RegistroInput } from '@/schemas/auth';
import { PerfilInput } from '@/schemas/perfil';
import { Usuaria } from '@/types';

interface AuthContextValue {
  usuaria: Usuaria | null;
  restaurando: boolean;
  login: (datos: LoginInput) => Promise<void>;
  registro: (datos: RegistroInput) => Promise<void>;
  logout: () => Promise<void>;
  actualizarPerfil: (cambios: Partial<PerfilInput> & { fotoUri?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuaria, setUsuaria] = useState<Usuaria | null>(null);
  const [restaurando, setRestaurando] = useState(true);

  useEffect(() => {
    authService
      .restaurarSesion()
      .then(setUsuaria)
      .finally(() => setRestaurando(false));
  }, []);

  const login = useCallback(async (datos: LoginInput) => {
    setUsuaria(await authService.login(datos));
  }, []);

  const registro = useCallback(async (datos: RegistroInput) => {
    setUsuaria(await authService.registro(datos));
  }, []);

  const logout = useCallback(async () => {
    await authService.cerrarSesion();
    setUsuaria(null);
  }, []);

  const actualizarPerfil = useCallback(
    async (cambios: Partial<PerfilInput> & { fotoUri?: string }) => {
      if (!usuaria) return;
      setUsuaria(await authService.actualizarPerfil(usuaria.id, cambios));
    },
    [usuaria]
  );

  const value = useMemo(
    () => ({ usuaria, restaurando, login, registro, logout, actualizarPerfil }),
    [usuaria, restaurando, login, registro, logout, actualizarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

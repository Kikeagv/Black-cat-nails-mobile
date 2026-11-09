/**
 * AuthContext — estado global de la sesión (Firebase Authentication).
 *
 * Es la única puerta de la interfaz hacia `authService`. Se suscribe a
 * onAuthStateChanged al montar la app: Firebase restaura la sesión guardada y
 * avisa cada vez que alguien entra o sale. El navegador raíz lee `usuaria` y
 * `perfilPendiente` para decidir qué pantallas mostrar.
 */

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services';
import type { EstadoSesion } from '@/services/authService';
import { CompletarPerfilInput, LoginInput, RegistroInput } from '@/schemas/auth';
import { PerfilInput } from '@/schemas/perfil';
import { Usuaria } from '@/types';

interface AuthContextValue {
  usuaria: Usuaria | null;
  /** Entró con Google y falta completar el perfil. */
  perfilPendiente: { nombre: string; correo: string } | null;
  restaurando: boolean;
  login: (datos: LoginInput) => Promise<void>;
  loginConGoogle: () => Promise<void>;
  registro: (datos: RegistroInput) => Promise<void>;
  completarPerfil: (datos: CompletarPerfilInput) => Promise<void>;
  recuperarPassword: (correo: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Devuelve un aviso si el cambio queda pendiente (cambio de correo). */
  actualizarPerfil: (cambios: Partial<PerfilInput> & { fotoUri?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion | null>(null);

  useEffect(() => authService.observarSesion(setEstado), []);

  const usuaria = estado?.tipo === 'activa' ? estado.usuaria : null;
  const perfilPendiente =
    estado?.tipo === 'perfil_pendiente' ? { nombre: estado.nombre, correo: estado.correo } : null;

  const actualizarPerfil = useCallback(
    async (cambios: Partial<PerfilInput> & { fotoUri?: string }) => {
      if (!usuaria) return null;
      // No hace falta actualizar el estado a mano: el onSnapshot del perfil lo trae.
      return authService.actualizarPerfil(usuaria, cambios);
    },
    [usuaria]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      usuaria,
      perfilPendiente,
      restaurando: estado === null,
      login: authService.login,
      loginConGoogle: authService.loginConGoogle,
      registro: authService.registro,
      completarPerfil: authService.completarPerfil,
      recuperarPassword: authService.recuperarPassword,
      logout: authService.cerrarSesion,
      actualizarPerfil,
    }),
    // perfilPendiente se deriva de estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estado, usuaria, actualizarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

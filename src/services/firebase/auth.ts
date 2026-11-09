/**
 * Firebase Auth en web: el SDK guarda la sesión en IndexedDB del navegador.
 * (En iOS y Android Metro usa auth.native.ts en lugar de este archivo.)
 */

import { Auth, browserLocalPersistence, connectAuthEmulator, initializeAuth } from 'firebase/auth';
import { hostEmuladores, usarEmuladores } from '@/config/firebase';
import { obtenerApp } from './app';

let auth: Auth | null = null;

export function obtenerAuth(): Auth {
  if (auth) return auth;
  // El resolver de ventanas emergentes se pasa recién en signInWithPopup, así
  // el script de Google solo se descarga cuando la clienta toca el botón.
  auth = initializeAuth(obtenerApp(), { persistence: browserLocalPersistence });
  auth.languageCode = 'es';
  if (usarEmuladores) connectAuthEmulator(auth, `http://${hostEmuladores}:9099`, { disableWarnings: true });
  return auth;
}

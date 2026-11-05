/**
 * Firebase Auth en iOS y Android.
 *
 * El SDK web de Firebase no sabe dónde guardar la sesión en React Native, así
 * que se le pasa AsyncStorage con getReactNativePersistence. Así la clienta
 * sigue con la sesión abierta después de cerrar la app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth, connectAuthEmulator, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { hostEmuladores, usarEmuladores } from '@/config/firebase';
import { obtenerApp } from './app';

let auth: Auth | null = null;

export function obtenerAuth(): Auth {
  if (auth) return auth;
  auth = initializeAuth(obtenerApp(), { persistence: getReactNativePersistence(AsyncStorage) });
  auth.languageCode = 'es';
  if (usarEmuladores) connectAuthEmulator(auth, `http://${hostEmuladores}:9099`, { disableWarnings: true });
  return auth;
}

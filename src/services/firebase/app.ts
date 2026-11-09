/**
 * Inicialización de Firebase (una sola instancia para toda la app).
 *
 * Firestore se inicializa con caché persistente en web y caché en memoria en
 * móvil (el SDK web no tiene IndexedDB en React Native). Si está activo el modo
 * emulador, la app se conecta al Firebase Emulator Suite local en lugar del
 * proyecto en la nube.
 */

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { firebaseConfig, hostEmuladores, usarEmuladores } from '@/config/firebase';

const CONFIG_EMULADOR = { apiKey: 'demo-key', projectId: 'demo-black-cat-nails', authDomain: 'localhost' };

let db: Firestore | null = null;

export function obtenerApp(): FirebaseApp {
  if (getApps().length) return getApp();
  const config = usarEmuladores && !firebaseConfig.apiKey ? CONFIG_EMULADOR : firebaseConfig;
  return initializeApp(config);
}

export function obtenerDb(): Firestore {
  if (db) return db;
  db = initializeFirestore(obtenerApp(), {
    localCache: Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache(),
    // Algunas redes móviles cortan los WebChannel; el autodetect cae a long polling.
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });
  if (usarEmuladores) connectFirestoreEmulator(db, hostEmuladores, 8080);
  return db;
}

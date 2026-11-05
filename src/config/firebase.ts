/**
 * Configuración de Firebase leída de variables de entorno (archivo `.env`).
 *
 * Expo inyecta en el bundle solo las variables que empiezan con EXPO_PUBLIC_.
 * Estos valores identifican al proyecto pero no son secretos: la seguridad real
 * está en las reglas de Firestore (firestore.rules), no en ocultar la apiKey.
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** IDs de cliente OAuth para Google Sign-In (consola de Firebase / Google Cloud). */
export const googleConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};

/** Con EXPO_PUBLIC_USAR_EMULADORES=1 la app usa el Firebase Emulator Suite local. */
export const usarEmuladores = process.env.EXPO_PUBLIC_USAR_EMULADORES === '1';
export const hostEmuladores = process.env.EXPO_PUBLIC_HOST_EMULADORES ?? '127.0.0.1';

export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

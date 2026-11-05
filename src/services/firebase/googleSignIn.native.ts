/**
 * Inicio de sesión con Google en iOS y Android.
 *
 * 1. El SDK nativo de Google (@react-native-google-signin) muestra el selector
 *    de cuentas del sistema y devuelve un idToken firmado por Google.
 * 2. Ese idToken se convierte en una credencial de Firebase y se inicia sesión
 *    con signInWithCredential; desde ahí la sesión la maneja Firebase Auth.
 *
 * El módulo nativo no existe dentro de Expo Go, por eso se carga con require()
 * recién al tocar el botón: así el resto de la app sigue funcionando en Expo Go.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential, UserCredential } from 'firebase/auth';
import { googleConfig } from '@/config/firebase';
import { ServiceError } from '../errores';
import { obtenerAuth } from './auth';

type ModuloGoogle = typeof import('@react-native-google-signin/google-signin');

let modulo: ModuloGoogle | null = null;

function cargarModulo(): ModuloGoogle {
  if (modulo) return modulo;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new ServiceError(
      'google_no_disponible',
      'Google necesita la app compilada (npx expo run:ios). En Expo Go usá tu correo y contraseña.'
    );
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('@react-native-google-signin/google-signin') as ModuloGoogle;
  } catch {
    throw new ServiceError('google_no_disponible', 'El inicio con Google no está disponible en esta compilación.');
  }
  modulo.GoogleSignin.configure({
    webClientId: googleConfig.webClientId, // el idToken debe emitirse para el cliente web de Firebase
    iosClientId: googleConfig.iosClientId || undefined,
  });
  return modulo;
}

export async function iniciarConGoogle(): Promise<UserCredential> {
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = cargarModulo();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const respuesta = await GoogleSignin.signIn();
    if (isCancelledResponse(respuesta)) {
      throw new ServiceError('cancelado', 'Cancelaste el inicio de sesión con Google');
    }
    const idToken = respuesta.data.idToken;
    if (!idToken) throw new ServiceError('google_no_disponible', 'Google no devolvió un token válido');
    return await signInWithCredential(obtenerAuth(), GoogleAuthProvider.credential(idToken));
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.IN_PROGRESS) throw new ServiceError('cancelado', 'Ya hay un inicio de sesión en curso');
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ServiceError('google_no_disponible', 'Google Play Services no está disponible en este dispositivo');
      }
    }
    throw e;
  }
}

export async function cerrarSesionGoogle(): Promise<void> {
  if (!modulo) return;
  try {
    await modulo.GoogleSignin.signOut(); // la próxima vez vuelve a mostrar el selector de cuentas
  } catch {
    // Si la clienta entró con correo, no hay sesión de Google que cerrar.
  }
}

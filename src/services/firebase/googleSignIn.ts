/**
 * Inicio de sesión con Google en la versión web: ventana emergente de Firebase.
 * (En iOS y Android Metro usa googleSignIn.native.ts.)
 */

import { browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { obtenerAuth } from './auth';

export async function iniciarConGoogle(): Promise<UserCredential> {
  const proveedor = new GoogleAuthProvider();
  proveedor.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(obtenerAuth(), proveedor, browserPopupRedirectResolver);
}

export async function cerrarSesionGoogle(): Promise<void> {
  // En web basta con signOut de Firebase.
}

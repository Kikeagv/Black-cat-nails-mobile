/**
 * Error tipado de la capa de datos. Mismo contrato que `ApiError` de la web:
 * un código estable para la lógica y un mensaje listo para mostrar.
 *
 * `traducirErrorFirebase` convierte los códigos de Firebase Auth y Firestore
 * (en inglés y pensados para desarrolladores) en mensajes para la clienta.
 */
export type CodigoError =
  | 'credenciales_invalidas'
  | 'correo_duplicado'
  | 'codigo_referido_invalido'
  | 'sesion_expirada'
  | 'no_autorizado'
  | 'horario_no_disponible'
  | 'transicion_invalida'
  | 'permiso_insuficiente'
  | 'cancelacion_tardia'
  | 'no_encontrado'
  | 'validacion'
  | 'red'
  | 'cancelado'
  | 'google_no_disponible'
  | 'demasiados_intentos'
  | 'requiere_login_reciente'
  | 'cuenta_otro_proveedor'
  | 'firebase_no_configurado';

export class ServiceError extends Error {
  readonly code: CodigoError;

  constructor(code: CodigoError, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

const MENSAJES_FIREBASE: Record<string, [CodigoError, string]> = {
  'auth/invalid-credential': ['credenciales_invalidas', 'Correo o contraseña incorrectos'],
  'auth/wrong-password': ['credenciales_invalidas', 'Correo o contraseña incorrectos'],
  'auth/user-not-found': ['credenciales_invalidas', 'Correo o contraseña incorrectos'],
  'auth/invalid-email': ['validacion', 'Correo inválido'],
  'auth/user-disabled': ['no_autorizado', 'Esta cuenta está deshabilitada. Comunicate con el salón.'],
  'auth/email-already-in-use': ['correo_duplicado', 'Ya existe una cuenta con ese correo'],
  'auth/weak-password': ['validacion', 'La contraseña es muy débil'],
  'auth/too-many-requests': [
    'demasiados_intentos',
    'Demasiados intentos fallidos. Esperá unos minutos o restablecé tu contraseña.',
  ],
  'auth/network-request-failed': ['red', 'Sin conexión. Revisá tu internet e intentá de nuevo.'],
  'auth/popup-closed-by-user': ['cancelado', 'Cancelaste el inicio de sesión con Google'],
  'auth/cancelled-popup-request': ['cancelado', 'Cancelaste el inicio de sesión con Google'],
  'auth/popup-blocked': ['google_no_disponible', 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes.'],
  'auth/account-exists-with-different-credential': [
    'cuenta_otro_proveedor',
    'Ese correo ya está registrado con contraseña. Iniciá sesión con tu correo.',
  ],
  'auth/requires-recent-login': [
    'requiere_login_reciente',
    'Por seguridad, cerrá sesión y volvé a entrar antes de cambiar tu correo.',
  ],
  'auth/invalid-api-key': ['firebase_no_configurado', 'Firebase no está configurado. Revisá el archivo .env.'],
  'permission-denied': ['permiso_insuficiente', 'No tenés permiso para realizar esta acción'],
  unavailable: ['red', 'Sin conexión con el servidor. Intentá de nuevo en un momento.'],
  'not-found': ['no_encontrado', 'El registro ya no existe'],
};

/** Convierte cualquier error de Firebase en un ServiceError con mensaje en español. */
export function traducirErrorFirebase(err: unknown): ServiceError {
  if (err instanceof ServiceError) return err;
  const code = (err as { code?: string })?.code;
  if (code && MENSAJES_FIREBASE[code]) {
    const [codigo, mensaje] = MENSAJES_FIREBASE[code];
    return new ServiceError(codigo, mensaje);
  }
  if (__DEV__) console.warn('[firebase]', code, err);
  return new ServiceError('red', 'Ocurrió un error al comunicarse con el servidor. Intentá de nuevo.');
}

/** Ejecuta una operación de Firebase y traduce el error si falla. */
export async function conFirebase<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (e) {
    throw traducirErrorFirebase(e);
  }
}

/** Mensaje amigable para cualquier error que llegue a la interfaz. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ServiceError) return err.message;
  return traducirErrorFirebase(err).message;
}

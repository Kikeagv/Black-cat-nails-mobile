/**
 * Error tipado de la capa de datos. Mismo contrato que `ApiError` de la web:
 * un código estable para la lógica y un mensaje listo para mostrar.
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
  | 'red';

export class ServiceError extends Error {
  readonly code: CodigoError;

  constructor(code: CodigoError, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

/** Mensaje amigable para cualquier error que llegue a la interfaz. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ServiceError) return err.message;
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}

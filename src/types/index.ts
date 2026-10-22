/**
 * MODELO DE DATOS — BLACK CAT NAILS MÓVIL
 *
 * Mismo modelo que la versión web (Etapa 2), con los campos que solo usa
 * la app móvil: foto de perfil, código de referido e imagen de referencia.
 * Las citas guardan una copia congelada de los servicios (desnormalización
 * documentada en la Etapa 1).
 */

export type Rol = 'admin' | 'clienta';

export type EstadoCita =
  | 'solicitada'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'inasistencia';

export interface Usuaria {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  inasistencias: number;      // contador precalculado
  codigoReferido: string;     // código propio para invitar amigas
  referidaPor?: string;       // código con el que se registró
  fotoUri?: string;           // foto de perfil local
  notasPrivadas?: string;
  creadaEn: string;           // ISO
}

/** Nunca sale de la capa de datos. */
export interface UsuariaConHash extends Usuaria {
  passwordHash: string;
}

export interface ConsumoInsumo {
  insumoId: string;
  cantidad: number;
}

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;          // 'Manicura' | 'Pedicura' | 'Nail art' | 'Acrílico' | 'Gel'
  precio: number;             // USD
  duracionMin: number;
  cicloRetornoDias: number;   // 0 = no requiere retoque
  activo: boolean;
  consumos: ConsumoInsumo[];
}

/** Copia congelada dentro de la cita. */
export interface ServicioEnCita {
  servicioId: string;
  nombre: string;
  precio: number;
  duracionMin: number;
}

export interface Cita {
  id: string;
  clientaId: string;
  clientaNombre?: string;
  servicios: ServicioEnCita[];
  inicio: string;             // ISO con zona -06:00
  fin: string;
  duracionTotalMin: number;   // incluye preparación
  montoTotal: number;
  estado: EstadoCita;
  notas?: string;
  imagenReferenciaUri?: string;
  insumosDescontados?: ConsumoInsumo[];
  montoCobrado?: number;
  fechaRetoque?: string;      // 'YYYY-MM-DD', se calcula al completar
  creadaEn: string;
}

export interface Diseno {
  id: string;
  nombre: string;
  categoria: string;
  precioDesde: number;
  descripcion: string;
  servicioSugeridoId: string;
  imagen: number;             // require() del asset local
  imagenDetalle?: number;
}

export interface Intervalo {
  inicio: string;
  fin: string;
}

export interface HorarioDisponible {
  hora: string;               // 'HH:mm'
  disponible: boolean;
}

export type EstadoInsumo = 'ok' | 'bajo' | 'critico';

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;             // 'ml' | 'g' | 'unidad'
  existencia: number;
  minimo: number;
  costo: number;              // USD por unidad
  estado?: EstadoInsumo;
}

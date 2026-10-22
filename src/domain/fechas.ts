/**
 * UTILIDADES DE FECHA — zona horaria fija del negocio (El Salvador, UTC-6, sin horario de verano).
 *
 * Se trabaja con cadenas 'YYYY-MM-DD' y con ISO con sufijo -06:00, igual que la
 * versión web, para que la hora de una cita no dependa de la zona del teléfono.
 */

export const OFFSET_NEGOCIO = '-06:00';
const OFFSET_MS = 6 * 60 * 60 * 1000;

export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Fecha civil de hoy en El Salvador como 'YYYY-MM-DD'. */
export function hoyNegocio(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

/** Suma días a una fecha 'YYYY-MM-DD'. */
export function sumarDias(ymd: string, dias: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  f.setUTCDate(f.getUTCDate() + dias);
  return f.toISOString().slice(0, 10);
}

/** Construye un ISO con la zona del negocio a partir de fecha y hora locales. */
export function aIsoNegocio(ymd: string, hora: string): string {
  return `${ymd}T${hora}:00${OFFSET_NEGOCIO}`;
}

/** Descompone un ISO en sus partes civiles en la zona del negocio. */
export function partesNegocio(iso: string) {
  const local = new Date(Date.parse(iso) - OFFSET_MS);
  return {
    ymd: local.toISOString().slice(0, 10),
    dia: local.getUTCDate(),
    mes: local.getUTCMonth(),
    anio: local.getUTCFullYear(),
    diaSemana: local.getUTCDay(),
    hora: local.toISOString().slice(11, 16),
  };
}

/** Día de la semana (0 = domingo) de una fecha 'YYYY-MM-DD'. */
export function diaSemana(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 'Sáb 6 Sep' */
export function formatoFechaCorta(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${DIAS_CORTOS[diaSemana(ymd)]} ${d} ${MESES_CORTOS[m - 1]}`;
}

/** 'Sáb 6 Sep · 14:00' a partir de un ISO. */
export function formatoFechaHora(iso: string): string {
  const p = partesNegocio(iso);
  return `${formatoFechaCorta(p.ymd)} · ${p.hora}`;
}

/** 165 → '2h 45min' */
export function formatoDuracion(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/** 35 → '$35.00' */
export function formatoMonto(monto: number): string {
  return `$${monto.toFixed(2)}`;
}

/**
 * Semanas del mes para el calendario (lunes primero, como en Figma).
 * Cada celda es una fecha 'YYYY-MM-DD' o null si cae fuera del mes.
 */
export function semanasDelMes(anio: number, mes: number): (string | null)[][] {
  const primero = new Date(Date.UTC(anio, mes, 1));
  const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const desfase = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const celdas: (string | null)[] = Array(desfase).fill(null);
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

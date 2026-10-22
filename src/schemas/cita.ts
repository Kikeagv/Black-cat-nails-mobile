import { z } from 'zod';

/**
 * Validación del paso de confirmación del agendamiento.
 * Las mismas reglas que valida la API de la versión web (crearCitaSchema).
 */
export const confirmacionCitaSchema = z.object({
  notas: z
    .string()
    .trim()
    .max(300, 'Las notas no pueden superar 300 caracteres'),
  aceptaPolitica: z
    .boolean()
    .refine((v) => v, 'Debés aceptar la política de cancelación'),
});

export const crearCitaSchema = z.object({
  servicioIds: z
    .array(z.string().min(1))
    .min(1, 'Seleccioná al menos un servicio'),
  inicio: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'La fecha y hora de inicio no es válida'),
  notas: z.string().trim().max(300).optional(),
  imagenReferenciaUri: z.string().optional(),
});

export type ConfirmacionCitaInput = z.infer<typeof confirmacionCitaSchema>;
export type CrearCitaInput = z.infer<typeof crearCitaSchema>;

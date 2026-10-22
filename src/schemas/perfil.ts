import { z } from 'zod';

export const perfilSchema = z.object({
  correo: z.string().trim().email('Correo electrónico no válido'),
  telefono: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos numéricos'),
});

export type PerfilInput = z.infer<typeof perfilSchema>;

import { z } from 'zod';

/**
 * Esquemas de validación de autenticación.
 * Las reglas de nombre, correo, teléfono y contraseña son las mismas de la
 * versión web, de modo que una cuenta válida en una plataforma lo es en la otra.
 */

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo')
    .email('Correo inválido'),
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña'),
});

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(60, 'El nombre no puede superar 60 caracteres')
      .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/, 'El nombre solo puede contener letras'),
    correo: z
      .string()
      .trim()
      .min(1, 'Ingresá tu correo')
      .email('Correo inválido'),
    telefono: z
      .string()
      .trim()
      .regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos numéricos'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
      .regex(/\d/, 'La contraseña debe incluir al menos un número'),
    confirmarPassword: z.string().min(1, 'Confirmá tu contraseña'),
    codigoReferido: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^([A-Z]{3,6}\d{4})?$/, 'El código tiene el formato NOMBRE2026'),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    path: ['confirmarPassword'],
    message: 'Las contraseñas no coinciden',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;

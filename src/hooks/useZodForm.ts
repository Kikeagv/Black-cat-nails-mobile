/**
 * useZodForm — manejo de formularios validado con un esquema Zod.
 *
 * - Guarda los valores y los errores por campo.
 * - Valida un campo al salir de él (onBlur) y todo el formulario al enviar.
 * - Solo llama a `onSubmit` cuando los datos pasan la validación.
 */

import { useCallback, useState } from 'react';
import { z } from 'zod';

type Errores<T> = Partial<Record<keyof T, string>>;

export function useZodForm<S extends z.ZodType<Record<string, unknown>>>(
  schema: S,
  valoresIniciales: z.input<S>
) {
  type Valores = z.input<S>;
  const [valores, setValores] = useState<Valores>(valoresIniciales);
  const [errores, setErrores] = useState<Errores<Valores>>({});
  const [tocados, setTocados] = useState<Partial<Record<keyof Valores, boolean>>>({});
  const [enviando, setEnviando] = useState(false);

  const erroresDe = useCallback(
    (v: Valores): Errores<Valores> => {
      const res = schema.safeParse(v);
      if (res.success) return {};
      const e: Errores<Valores> = {};
      for (const issue of res.error.issues) {
        const campo = issue.path[0] as keyof Valores;
        if (campo && !e[campo]) e[campo] = issue.message;
      }
      return e;
    },
    [schema]
  );

  const cambiar = useCallback(
    <K extends keyof Valores>(campo: K, valor: Valores[K]) => {
      setValores((prev) => {
        const next = { ...(prev as object), [campo]: valor } as Valores;
        // Si el campo ya mostró un error, se revalida mientras se corrige.
        if (tocados[campo]) setErrores(erroresDe(next));
        return next;
      });
    },
    [tocados, erroresDe]
  );

  const salir = useCallback(
    (campo: keyof Valores) => {
      setTocados((prev) => ({ ...prev, [campo]: true }));
      setErrores((prev) => ({ ...prev, [campo]: erroresDe(valores)[campo] }));
    },
    [valores, erroresDe]
  );

  const enviar = useCallback(
    async (onSubmit: (datos: z.output<S>) => Promise<void>) => {
      const res = schema.safeParse(valores);
      const todos = Object.keys(valores as object).reduce((acc, k) => ({ ...acc, [k]: true }), {});
      setTocados(todos);
      if (!res.success) {
        setErrores(erroresDe(valores));
        return;
      }
      setErrores({});
      setEnviando(true);
      try {
        await onSubmit(res.data);
      } finally {
        setEnviando(false);
      }
    },
    [schema, valores, erroresDe]
  );

  return { valores, errores, enviando, cambiar, salir, enviar };
}

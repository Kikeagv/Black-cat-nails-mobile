/**
 * TOKENS DEL SISTEMA DE DISEÑO — BLACK CAT NAILS MÓVIL
 *
 * Traducción directa de las variables definidas en Figma (Tabla 7 de la Etapa 1).
 * Los nombres de color coinciden con los de Figma para que cualquier ajuste
 * en el diseño se pueda trasladar sin ambigüedad.
 */

export const colors = {
  // Variables de Figma
  dark: '#191308',          // fondo principal (bg-base)
  berryCrush: '#B5446E',    // tarjetas destacadas y encabezados (surface)
  petalPink: '#E477C1',     // botones principales y elementos activos (primary)
  wisteriaBlue: '#9CA3DB',  // estados, etiquetas e iconografía (accent)
  white: '#FFFFFF',

  // Derivados para superficies y textos secundarios
  card: '#2A2219',
  cardAlt: '#3A3128',
  border: 'rgba(255,255,255,0.10)',
  textMuted: 'rgba(255,255,255,0.60)',
  textSubtle: 'rgba(255,255,255,0.45)',
  placeholder: 'rgba(255,255,255,0.50)',
  error: '#F26B6B',
  errorBg: 'rgba(242,107,107,0.15)',
  overlay: 'rgba(0,0,0,0.65)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fonts = {
  display: 'PlayfairDisplay_700Bold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Escala tipográfica: display 32/24, body 16, label 13 (Etapa 1, Tabla 7). */
export const type = {
  display: { fontFamily: fonts.display, fontSize: 32, color: colors.white },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  subtitle: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.white },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  caption: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
} as const;

import { StyleSheet, Text, View } from 'react-native';
import { ETIQUETAS_ESTADO } from '@/domain';
import { colors, fonts, radius } from '@/theme/tokens';
import { EstadoCita } from '@/types';

/** Colores de cada estado de la máquina de estados (Figura 4 de la Etapa 1). */
const ESTILO: Record<EstadoCita, { fondo: string; borde: string; texto: string; etiqueta?: string }> = {
  solicitada: { fondo: 'rgba(181,68,110,0.25)', borde: colors.berryCrush, texto: colors.petalPink, etiqueta: 'Pendiente' },
  confirmada: { fondo: 'rgba(156,163,219,0.18)', borde: colors.wisteriaBlue, texto: colors.white },
  en_curso: { fondo: 'rgba(228,119,193,0.2)', borde: colors.petalPink, texto: colors.petalPink },
  completada: { fondo: colors.cardAlt, borde: colors.cardAlt, texto: colors.textMuted },
  cancelada: { fondo: colors.errorBg, borde: 'rgba(242,107,107,0.4)', texto: colors.error },
  inasistencia: { fondo: colors.errorBg, borde: 'rgba(242,107,107,0.4)', texto: colors.error },
};

export function BadgeEstado({ estado }: { estado: EstadoCita }) {
  const e = ESTILO[estado];
  return (
    <View style={[styles.badge, { backgroundColor: e.fondo, borderColor: e.borde }]}>
      <Text style={[styles.texto, { color: e.texto }]}>{e.etiqueta ?? ETIQUETAS_ESTADO[estado]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  texto: { fontFamily: fonts.semibold, fontSize: 10 },
});

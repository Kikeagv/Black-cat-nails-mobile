import { Feather } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

interface Props {
  titulo: string;
  onVolver?: () => void;
  derecha?: ReactNode;
  centrado?: boolean;
}

/** Encabezado de pantalla con botón de regreso cuadrado, como en Figma. */
export function Encabezado({ titulo, onVolver, derecha, centrado = false }: Props) {
  return (
    <View style={styles.fila}>
      {onVolver && (
        <Pressable onPress={onVolver} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver">
          <Feather name="chevron-left" size={20} color={colors.white} />
        </Pressable>
      )}
      <Text style={[styles.titulo, centrado && styles.centrado]} numberOfLines={1}>
        {titulo}
      </Text>
      {derecha ?? (centrado && onVolver ? <View style={styles.volverFantasma} /> : null)}
    </View>
  );
}

export function BotonIcono({
  icono,
  onPress,
  etiqueta,
}: {
  icono: keyof typeof Feather.glyphMap;
  onPress: () => void;
  etiqueta: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.volver} accessibilityRole="button" accessibilityLabel={etiqueta}>
      <Feather name={icono} size={18} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16, paddingBottom: 16 },
  volver: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volverFantasma: { width: 40 },
  titulo: { flex: 1, fontFamily: fonts.display, fontSize: 28, color: colors.white },
  centrado: { textAlign: 'center' },
});

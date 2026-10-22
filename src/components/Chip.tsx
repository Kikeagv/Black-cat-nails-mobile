import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

interface Props {
  texto: string;
  activo?: boolean;
  onPress?: () => void;
  pequeno?: boolean;
}

/** Píldora de filtro (galería) o de paso (agendamiento). */
export function Chip({ texto, activo = false, onPress, pequeno = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: activo }}
      style={[styles.base, pequeno && styles.pequeno, activo ? styles.activo : pequeno ? styles.inactivoPaso : styles.inactivo]}
    >
      <Text style={[styles.texto, pequeno && styles.textoPequeno, activo && styles.textoActivo]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 16, height: 34, borderRadius: radius.pill, justifyContent: 'center' },
  pequeno: { paddingHorizontal: 10, height: 24 },
  activo: { backgroundColor: colors.petalPink },
  inactivo: { borderWidth: 1, borderColor: colors.wisteriaBlue },
  inactivoPaso: { backgroundColor: colors.card },
  texto: { fontFamily: fonts.medium, fontSize: 14, color: colors.wisteriaBlue },
  textoPequeno: { fontSize: 11, color: colors.textMuted },
  textoActivo: { color: colors.dark, fontFamily: fonts.semibold },
});

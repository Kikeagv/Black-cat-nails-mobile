import { AntDesign } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

interface Props {
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  titulo?: string;
}

/** Botón "Continuar con Google" (fondo blanco, como piden las guías de Google). */
export function BotonGoogle({ onPress, cargando = false, deshabilitado = false, titulo = 'Continuar con Google' }: Props) {
  const inactivo = cargando || deshabilitado;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [styles.boton, pressed && styles.presionado, inactivo && styles.inactivo]}
    >
      {cargando ? (
        <ActivityIndicator color={colors.dark} />
      ) : (
        <>
          <AntDesign name="google" size={18} color="#4285F4" />
          <Text style={styles.texto}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Línea divisoria con una palabra al centro ("o"). */
export function Divisor({ texto = 'o' }: { texto?: string }) {
  return (
    <View style={styles.divisor}>
      <View style={styles.linea} />
      <Text style={styles.divisorTexto}>{texto}</Text>
      <View style={styles.linea} />
    </View>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  presionado: { opacity: 0.85 },
  inactivo: { opacity: 0.6 },
  texto: { fontFamily: fonts.semibold, fontSize: 15, color: '#1F1F1F' },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linea: { flex: 1, height: 1, backgroundColor: colors.border },
  divisorTexto: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle },
});

import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

type Variante = 'primario' | 'secundario' | 'contorno';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: keyof typeof Feather.glyphMap;
  iconoDerecha?: keyof typeof Feather.glyphMap;
  compacto?: boolean;
  style?: ViewStyle;
}

/** Botón de la marca. El primario usa Petal Pink, como en todos los mockups. */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
  icono,
  iconoDerecha,
  compacto = false,
  style,
}: Props) {
  const inactivo = deshabilitado || cargando;
  const colorTexto = variante === 'primario' ? colors.dark : variante === 'secundario' ? colors.petalPink : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.base,
        compacto && styles.compacto,
        styles[variante],
        inactivo && styles.inactivo,
        pressed && !inactivo && styles.presionado,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono && <Feather name={icono} size={compacto ? 14 : 18} color={colorTexto} />}
          <Text style={[styles.texto, compacto && styles.textoCompacto, { color: colorTexto }]}>{titulo}</Text>
          {iconoDerecha && <Feather name={iconoDerecha} size={compacto ? 14 : 18} color={colorTexto} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  compacto: { height: 36, borderRadius: radius.md, paddingHorizontal: 12 },
  primario: { backgroundColor: colors.petalPink },
  secundario: { backgroundColor: 'rgba(181,68,110,0.25)', borderWidth: 1, borderColor: colors.berryCrush },
  contorno: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  inactivo: { opacity: 0.5 },
  presionado: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  texto: { fontFamily: fonts.semibold, fontSize: 16 },
  textoCompacto: { fontSize: 13 },
});

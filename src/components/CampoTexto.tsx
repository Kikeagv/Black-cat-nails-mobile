import { Feather } from '@expo/vector-icons';
import { ComponentRef, Ref, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props extends TextInputProps {
  etiqueta?: string;
  error?: string;
  icono?: keyof typeof Feather.glyphMap;
  contrasena?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/**
 * Campo de texto con los tres estados del mockup de login:
 * normal (borde Wisteria), con foco (borde Petal Pink) y con error (borde rojo + mensaje).
 */
export function CampoTexto({ etiqueta, error, icono, contrasena = false, style, onFocus, onBlur, ref, ...rest }: Props) {
  const [foco, setFoco] = useState(false);
  const [oculto, setOculto] = useState(contrasena);

  return (
    <View style={styles.wrapper}>
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      <View style={[styles.caja, foco && styles.cajaFoco, !!error && styles.cajaError]}>
        {icono && <Feather name={icono} size={18} color={colors.wisteriaBlue} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style]}
          secureTextEntry={oculto}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          accessibilityLabel={etiqueta ?? rest.placeholder}
          {...rest}
        />
        {contrasena && (
          <Pressable
            onPress={() => setOculto((v) => !v)}
            hitSlop={10}
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <Feather name={oculto ? 'eye' : 'eye-off'} size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  etiqueta: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  caja: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.wisteriaBlue,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cajaFoco: { borderColor: colors.petalPink },
  cajaError: { borderColor: colors.error },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.white, paddingVertical: 12 },
  error: { fontFamily: fonts.regular, fontSize: 12, color: colors.error, marginLeft: 4 },
});

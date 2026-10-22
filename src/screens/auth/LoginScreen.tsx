import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ComponentRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Boton, CampoTexto, Logo, Pantalla } from '@/components';
import { useAuth } from '@/context';
import { useZodForm } from '@/hooks/useZodForm';
import { AuthStackParams } from '@/navigation/tipos';
import { loginSchema } from '@/schemas/auth';
import { mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

/** Figma: login-default, login-error-state y login-loading-state. */
export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { valores, errores, enviando, cambiar, salir, enviar } = useZodForm(loginSchema, { correo: '', password: '' });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const onSubmit = () =>
    enviar(async (datos) => {
      setErrorGeneral(null);
      try {
        await login(datos);
        // No hace falta navegar: el navegador raíz cambia solo cuando hay usuaria.
      } catch (e) {
        setErrorGeneral(mensajeDeError(e));
      }
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla edges={['top', 'bottom']} contentStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Logo />
          <Text style={styles.marca}>Black Cat Nails</Text>
        </View>

        <View style={styles.formulario}>
          {errorGeneral && (
            <View style={styles.alerta} accessibilityRole="alert">
              <Text style={styles.alertaTexto}>{errorGeneral}</Text>
            </View>
          )}
          <CampoTexto
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            value={valores.correo}
            onChangeText={(t) => cambiar('correo', t)}
            onBlur={() => salir('correo')}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errores.correo}
            editable={!enviando}
          />
          <CampoTexto
            ref={passwordRef}
            placeholder="Contraseña"
            contrasena
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            value={valores.password}
            onChangeText={(t) => cambiar('password', t)}
            onBlur={() => salir('password')}
            onSubmitEditing={onSubmit}
            error={errores.password}
            editable={!enviando}
          />
        </View>

        <Boton titulo="Iniciar sesión" onPress={onSubmit} cargando={enviando} />

        <View style={styles.pie}>
          <Text style={styles.pieTexto}>¿No tenés cuenta?</Text>
          <Pressable onPress={() => navigation.navigate('Registro')} disabled={enviando} hitSlop={8}>
            <Text style={styles.enlace}>Registrate</Text>
          </Pressable>
        </View>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dark },
  contenido: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 48, gap: 32 },
  encabezado: { alignItems: 'center', gap: 12 },
  marca: { fontFamily: fonts.display, fontSize: 32, color: colors.white },
  formulario: { gap: 16 },
  alerta: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(242,107,107,0.4)',
    padding: 12,
  },
  alertaTexto: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, textAlign: 'center' },
  pie: { flexDirection: 'row', justifyContent: 'center', gap: 4, paddingTop: 16 },
  pieTexto: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  enlace: { fontFamily: fonts.semibold, fontSize: 14, color: colors.wisteriaBlue },
});

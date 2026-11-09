import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ComponentRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Boton, BotonGoogle, CampoTexto, Divisor, Logo, Pantalla } from '@/components';
import { useAuth } from '@/context';
import { useZodForm } from '@/hooks/useZodForm';
import { AuthStackParams } from '@/navigation/tipos';
import { loginSchema } from '@/schemas/auth';
import { mensajeDeError, ServiceError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { avisar } from '@/utils/dialogos';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

/**
 * Figma: login-default, login-error-state y login-loading-state.
 * Foro 2: Firebase Authentication con correo/contraseña y con Google,
 * más recuperación de contraseña por correo.
 */
export function LoginScreen({ navigation }: Props) {
  const { login, loginConGoogle, recuperarPassword } = useAuth();
  const { valores, errores, enviando, cambiar, salir, enviar } = useZodForm(loginSchema, { correo: '', password: '' });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [conGoogle, setConGoogle] = useState(false);
  const ocupado = enviando || conGoogle;
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

  const entrarConGoogle = async () => {
    setErrorGeneral(null);
    setConGoogle(true);
    try {
      await loginConGoogle();
    } catch (e) {
      // Cerrar la ventana de Google no es un error que haya que mostrar.
      if (!(e instanceof ServiceError && e.code === 'cancelado')) setErrorGeneral(mensajeDeError(e));
    } finally {
      setConGoogle(false);
    }
  };

  const olvideMiPassword = async () => {
    setErrorGeneral(null);
    try {
      await recuperarPassword(valores.correo);
      avisar(
        'Revisá tu correo',
        `Si ${valores.correo.trim()} tiene una cuenta, te llegará un enlace para crear una contraseña nueva.`
      );
    } catch (e) {
      setErrorGeneral(mensajeDeError(e));
    }
  };

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
            editable={!ocupado}
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
            editable={!ocupado}
          />
          <Pressable onPress={olvideMiPassword} disabled={ocupado} hitSlop={8} style={styles.olvide}>
            <Text style={styles.enlaceChico}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <View style={styles.acciones}>
          <Boton titulo="Iniciar sesión" onPress={onSubmit} cargando={enviando} deshabilitado={conGoogle} />
          <Divisor />
          <BotonGoogle onPress={entrarConGoogle} cargando={conGoogle} deshabilitado={enviando} />
        </View>

        <View style={styles.pie}>
          <Text style={styles.pieTexto}>¿No tenés cuenta?</Text>
          <Pressable onPress={() => navigation.navigate('Registro')} disabled={ocupado} hitSlop={8}>
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
  acciones: { gap: 16 },
  olvide: { alignSelf: 'flex-end', marginTop: -4 },
  enlaceChico: { fontFamily: fonts.medium, fontSize: 13, color: colors.wisteriaBlue },
  pie: { flexDirection: 'row', justifyContent: 'center', gap: 4, paddingTop: 8 },
  pieTexto: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  enlace: { fontFamily: fonts.semibold, fontSize: 14, color: colors.wisteriaBlue },
});

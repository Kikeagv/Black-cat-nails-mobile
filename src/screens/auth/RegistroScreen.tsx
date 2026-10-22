import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, CampoTexto, Encabezado, Logo, Pantalla } from '@/components';
import { useAuth } from '@/context';
import { useZodForm } from '@/hooks/useZodForm';
import { AuthStackParams } from '@/navigation/tipos';
import { registroSchema } from '@/schemas/auth';
import { mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<AuthStackParams, 'Registro'>;

/** Registro de clientas. Sigue el mismo lenguaje visual del login de Figma. */
export function RegistroScreen({ navigation }: Props) {
  const { registro } = useAuth();
  const { valores, errores, enviando, cambiar, salir, enviar } = useZodForm(registroSchema, {
    nombre: '',
    correo: '',
    telefono: '',
    password: '',
    confirmarPassword: '',
    codigoReferido: '',
  });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const onSubmit = () =>
    enviar(async (datos) => {
      setErrorGeneral(null);
      try {
        await registro(datos);
      } catch (e) {
        setErrorGeneral(mensajeDeError(e));
      }
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla edges={['top', 'bottom']} contentStyle={styles.contenido}>
        <Encabezado titulo="Crear cuenta" onVolver={() => navigation.goBack()} />
        <View style={styles.encabezado}>
          <Logo size={84} />
          <Text style={styles.subtitulo}>Agendá tus citas sin esperar respuesta por mensaje.</Text>
        </View>

        {errorGeneral && (
          <View style={styles.alerta} accessibilityRole="alert">
            <Text style={styles.alertaTexto}>{errorGeneral}</Text>
          </View>
        )}

        <View style={styles.formulario}>
          <CampoTexto
            etiqueta="Nombre completo"
            placeholder="Camila Pérez"
            autoComplete="name"
            value={valores.nombre}
            onChangeText={(t) => cambiar('nombre', t)}
            onBlur={() => salir('nombre')}
            error={errores.nombre}
          />
          <CampoTexto
            etiqueta="Correo"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={valores.correo}
            onChangeText={(t) => cambiar('correo', t)}
            onBlur={() => salir('correo')}
            error={errores.correo}
          />
          <CampoTexto
            etiqueta="Teléfono"
            placeholder="70001234"
            keyboardType="number-pad"
            maxLength={8}
            value={valores.telefono}
            onChangeText={(t) => cambiar('telefono', t.replace(/\D/g, ''))}
            onBlur={() => salir('telefono')}
            error={errores.telefono}
          />
          <CampoTexto
            etiqueta="Contraseña"
            placeholder="Mínimo 8 caracteres, con letras y números"
            contrasena
            autoComplete="new-password"
            value={valores.password}
            onChangeText={(t) => cambiar('password', t)}
            onBlur={() => salir('password')}
            error={errores.password}
          />
          <CampoTexto
            etiqueta="Confirmar contraseña"
            placeholder="Repetí tu contraseña"
            contrasena
            value={valores.confirmarPassword}
            onChangeText={(t) => cambiar('confirmarPassword', t)}
            onBlur={() => salir('confirmarPassword')}
            error={errores.confirmarPassword}
          />
          <CampoTexto
            etiqueta="Código de referido (opcional)"
            placeholder="CAMI2026"
            autoCapitalize="characters"
            maxLength={10}
            value={valores.codigoReferido}
            onChangeText={(t) => cambiar('codigoReferido', t.toUpperCase())}
            onBlur={() => salir('codigoReferido')}
            error={errores.codigoReferido}
          />
        </View>

        <Boton titulo="Crear cuenta" onPress={onSubmit} cargando={enviando} />

        <View style={styles.pie}>
          <Text style={styles.pieTexto}>¿Ya tenés cuenta?</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.enlace}>Iniciá sesión</Text>
          </Pressable>
        </View>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dark },
  contenido: { paddingHorizontal: 24, gap: 20 },
  encabezado: { alignItems: 'center', gap: 10 },
  subtitulo: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  formulario: { gap: 14 },
  alerta: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(242,107,107,0.4)',
    padding: 12,
  },
  alertaTexto: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, textAlign: 'center' },
  pie: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  pieTexto: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  enlace: { fontFamily: fonts.semibold, fontSize: 14, color: colors.wisteriaBlue },
});

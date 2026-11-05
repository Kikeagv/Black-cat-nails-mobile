import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, CampoTexto, Logo, Pantalla } from '@/components';
import { useAuth } from '@/context';
import { useZodForm } from '@/hooks/useZodForm';
import { completarPerfilSchema } from '@/schemas/auth';
import { mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';

/**
 * Primer ingreso con Google. Google entrega nombre y correo, pero el salón
 * necesita el teléfono para confirmar citas, así que se pide antes de crear
 * el perfil en Firestore. Hasta completarlo, la navegación no muestra la app.
 */
export function CompletarPerfilScreen() {
  const { perfilPendiente, completarPerfil, logout } = useAuth();
  const { valores, errores, enviando, cambiar, salir, enviar } = useZodForm(completarPerfilSchema, {
    nombre: perfilPendiente?.nombre ?? '',
    telefono: '',
    codigoReferido: '',
  });
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const onSubmit = () =>
    enviar(async (datos) => {
      setErrorGeneral(null);
      try {
        await completarPerfil(datos);
      } catch (e) {
        setErrorGeneral(mensajeDeError(e));
      }
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla edges={['top', 'bottom']} contentStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Logo size={84} />
          <Text style={styles.titulo}>Ya casi terminás</Text>
          <Text style={styles.subtitulo}>
            Entraste con Google como <Text style={styles.correo}>{perfilPendiente?.correo}</Text>. Solo nos falta tu
            teléfono para confirmarte las citas.
          </Text>
        </View>

        {errorGeneral && (
          <View style={styles.alerta} accessibilityRole="alert">
            <Text style={styles.alertaTexto}>{errorGeneral}</Text>
          </View>
        )}

        <View style={styles.formulario}>
          <CampoTexto
            etiqueta="Nombre completo"
            value={valores.nombre}
            onChangeText={(t) => cambiar('nombre', t)}
            onBlur={() => salir('nombre')}
            error={errores.nombre}
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
            autoFocus
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

        <Boton titulo="Guardar y continuar" onPress={onSubmit} cargando={enviando} />
        <Pressable onPress={logout} disabled={enviando} hitSlop={8} style={styles.otra}>
          <Text style={styles.enlace}>Usar otra cuenta</Text>
        </Pressable>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dark },
  contenido: { paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  encabezado: { alignItems: 'center', gap: 10 },
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.white },
  subtitulo: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  correo: { fontFamily: fonts.semibold, color: colors.white },
  formulario: { gap: 14 },
  alerta: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(242,107,107,0.4)',
    padding: 12,
  },
  alertaTexto: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, textAlign: 'center' },
  otra: { alignSelf: 'center' },
  enlace: { fontFamily: fonts.semibold, fontSize: 14, color: colors.wisteriaBlue },
});

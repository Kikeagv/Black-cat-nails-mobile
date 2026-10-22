import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BarraInferior, Boton, CampoTexto, Encabezado, IndicadorPasos, Pantalla } from '@/components';
import { CANCELACION_MIN_HORAS } from '@/config';
import { useAgenda, useCatalogo } from '@/context';
import { formatoDuracion, formatoFechaCorta, formatoMonto, horaFin, resumirSeleccion } from '@/domain';
import { useZodForm } from '@/hooks/useZodForm';
import { ClientaStackParams } from '@/navigation/tipos';
import { confirmacionCitaSchema } from '@/schemas/cita';
import { mensajeDeError, ServiceError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { avisar } from '@/utils/dialogos';

type Props = NativeStackScreenProps<ClientaStackParams, 'AgendarConfirmacion'>;

/**
 * Figma: screen-4c-confirmacion. Explicita la política de cancelación y pide
 * confirmar asistencia, que es la medida contra inasistencias sin cobrar anticipo.
 */
export function AgendarConfirmacionScreen({ navigation }: Props) {
  const { servicios } = useCatalogo();
  const { borrador, actualizarBorrador, confirmarBorrador } = useAgenda();
  const { valores, errores, enviando, cambiar, salir, enviar } = useZodForm(confirmacionCitaSchema, {
    notas: borrador.notas,
    aceptaPolitica: false,
  });
  const [imagen, setImagen] = useState<string | undefined>(borrador.imagenReferenciaUri);

  const seleccion = servicios.filter((s) => borrador.servicioIds.includes(s.id));
  const resumen = resumirSeleccion(seleccion);
  const fin = borrador.hora ? horaFin(borrador.hora, resumen.duracionServiciosMin) : '';

  const elegirImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      avisar('Permiso necesario', 'Habilitá el acceso a tus fotos para adjuntar una imagen de referencia.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled) setImagen(res.assets[0].uri);
  };

  const verPolitica = () =>
    avisar(
      'Política de cancelación',
      `Podés cancelar tu cita desde la app hasta ${CANCELACION_MIN_HORAS} horas antes. Después de ese plazo, comunicate con el salón. Las inasistencias quedan registradas en tu historial.`
    );

  const confirmar = () =>
    enviar(async (datos) => {
      actualizarBorrador({ notas: datos.notas, imagenReferenciaUri: imagen });
      try {
        const cita = await confirmarBorrador();
        navigation.reset({
          index: 1,
          routes: [{ name: 'Tabs' }, { name: 'AgendarExito', params: { citaId: cita.id } }],
        });
      } catch (e) {
        if (e instanceof ServiceError && e.code === 'horario_no_disponible') {
          avisar('Horario ocupado', e.message, () => navigation.goBack());
        } else {
          avisar('No se pudo agendar', mensajeDeError(e));
        }
      }
    });

  // Las notas e imagen se guardan en el borrador antes de confirmar, para que no se pierdan al volver.
  const filas = [
    ['Servicios', seleccion.map((s) => s.nombre).join(', ')],
    ['Fecha', borrador.fecha ? formatoFechaCorta(borrador.fecha) : ''],
    ['Hora', borrador.hora ? `${borrador.hora} - ${fin} (${formatoDuracion(resumen.duracionServiciosMin)})` : ''],
  ];

  return (
    <Pantalla
      footer={
        <BarraInferior accion={<Boton titulo="Confirmar cita" onPress={confirmar} cargando={enviando} />} />
      }
    >
      <Encabezado titulo="Confirmación" onVolver={() => navigation.goBack()} />
      <IndicadorPasos actual={3} />

      <View style={styles.resumen}>
        <Text style={styles.resumenTitulo}>Resumen de tu cita</Text>
        {filas.map(([k, v]) => (
          <View key={k} style={styles.fila}>
            <Text style={styles.clave}>• {k}:</Text>
            <Text style={styles.valor}>{v}</Text>
          </View>
        ))}
        <View style={styles.fila}>
          <Text style={styles.clave}>• Total:</Text>
          <Text style={styles.total}>{formatoMonto(resumen.montoTotal)}</Text>
        </View>
      </View>

      <View style={styles.bloque}>
        <CampoTexto
          etiqueta="Notas para la estilista"
          placeholder="¿Algún detalle o preferencia especial?"
          multiline
          maxLength={320}
          value={valores.notas}
          onChangeText={(t) => cambiar('notas', t)}
          onBlur={() => salir('notas')}
          error={errores.notas}
          style={styles.notas}
        />
        <Text style={styles.contador}>{valores.notas.length}/300</Text>
      </View>

      {imagen ? (
        <View style={styles.imagenFila}>
          <Image source={{ uri: imagen }} style={styles.imagen} />
          <View style={styles.flex}>
            <Text style={styles.imagenTexto}>Imagen de referencia adjunta</Text>
            <Pressable onPress={() => setImagen(undefined)} hitSlop={8}>
              <Text style={styles.quitar}>Quitar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Boton titulo="Adjuntar imagen de referencia" icono="image" variante="contorno" compacto onPress={elegirImagen} />
      )}

      <Pressable
        style={styles.check}
        onPress={() => cambiar('aceptaPolitica', !valores.aceptaPolitica)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: valores.aceptaPolitica }}
      >
        <View style={[styles.caja, valores.aceptaPolitica && styles.cajaActiva, !!errores.aceptaPolitica && styles.cajaError]}>
          {valores.aceptaPolitica && <Feather name="check" size={14} color={colors.dark} />}
        </View>
        <Text style={styles.checkTexto}>
          Acepto la{' '}
          <Text style={styles.enlace} onPress={verPolitica}>
            política de cancelación
          </Text>{' '}
          de turnos y confirmo mi asistencia
        </Text>
      </Pressable>
      {!!errores.aceptaPolitica && <Text style={styles.error}>{errores.aceptaPolitica}</Text>}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  resumen: { backgroundColor: colors.berryCrush, borderRadius: radius.lg, padding: 16, gap: 10 },
  resumenTitulo: { fontFamily: fonts.display, fontSize: 17, color: colors.white, marginBottom: 4 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  clave: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  valor: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.white, textAlign: 'right' },
  total: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  bloque: { marginTop: 20 },
  notas: { minHeight: 70, textAlignVertical: 'top' },
  contador: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSubtle, textAlign: 'right', marginTop: 4, marginBottom: 12 },
  imagenFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imagen: { width: 56, height: 56, borderRadius: radius.md },
  imagenTexto: { fontFamily: fonts.medium, fontSize: 13, color: colors.white },
  quitar: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: 4 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  caja: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.wisteriaBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cajaActiva: { backgroundColor: colors.petalPink, borderColor: colors.petalPink },
  cajaError: { borderColor: colors.error },
  checkTexto: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  enlace: { color: colors.wisteriaBlue, textDecorationLine: 'underline' },
  error: { fontFamily: fonts.regular, fontSize: 12, color: colors.error, marginTop: 6, marginLeft: 30 },
});

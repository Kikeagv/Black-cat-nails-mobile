import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { BarraInferior, Boton, Pantalla } from '@/components';
import { useAgenda } from '@/context';
import { formatoFechaCorta, formatoMonto, partesNegocio } from '@/domain';
import { ClientaStackParams } from '@/navigation/tipos';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<ClientaStackParams, 'AgendarExito'>;

/** Figma: screen-4d-exito. Comprobante de la cita recién creada. */
export function AgendarExitoScreen({ navigation, route }: Props) {
  const { citas } = useAgenda();
  const cita = citas.find((c) => c.id === route.params.citaId);
  const p = cita ? partesNegocio(cita.inicio) : null;

  return (
    <Pantalla
      edges={['top']}
      footer={
        <BarraInferior
          accion={
            <View style={styles.acciones}>
              <Boton titulo="Volver al inicio" onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })} />
              <Boton
                titulo="Ver mis citas"
                variante="contorno"
                onPress={() => navigation.navigate('Tabs', { screen: 'MisCitas' })}
              />
            </View>
          }
        />
      }
    >
      <View style={styles.centro}>
        <View style={styles.circulo}>
          <Feather name="check" size={48} color={colors.petalPink} />
        </View>
        <Text style={styles.titulo}>¡Cita confirmada!</Text>
        <Text style={styles.sub}>¡Tu lugar está reservado! Te esperamos.</Text>

        {cita && p && (
          <View style={styles.comprobante}>
            <View style={styles.fila}>
              <Text style={styles.clave}>Fecha y Hora</Text>
              <Text style={styles.valor}>
                {formatoFechaCorta(p.ymd)}, {p.hora} hs
              </Text>
            </View>
            <View style={styles.fila}>
              <Text style={styles.clave}>Total estimado</Text>
              <Text style={styles.total}>{formatoMonto(cita.montoTotal)}</Text>
            </View>
          </View>
        )}
        <Text style={styles.recordatorio}>
          Te vamos a recordar tu cita antes de la fecha. Si no podés asistir, cancelala desde “Mis citas”.
        </Text>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', paddingTop: 72, gap: 12 },
  circulo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.petalPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.petalPink,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.white },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  comprobante: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.wisteriaBlue,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    marginTop: 20,
    backgroundColor: colors.card,
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between' },
  clave: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  valor: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  total: { fontFamily: fonts.bold, fontSize: 15, color: colors.petalPink },
  recordatorio: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSubtle, textAlign: 'center', marginTop: 12 },
  acciones: { gap: 10 },
});

import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BarraInferior, Boton, Encabezado, IndicadorPasos, Pantalla } from '@/components';
import { HORARIO } from '@/config';
import { useAgenda, useCatalogo } from '@/context';
import { diaSemana, formatoDuracion, formatoFechaCorta, hoyNegocio, MESES, resumirSeleccion, semanasDelMes } from '@/domain';
import { ClientaStackParams } from '@/navigation/tipos';
import { citasService, mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { HorarioDisponible } from '@/types';

type Props = NativeStackScreenProps<ClientaStackParams, 'AgendarFecha'>;

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES_ADELANTE = 2;

/**
 * Figma: screen-4b-fecha. Los horarios se calculan con la duración total de los
 * servicios elegidos; los que no caben o se cruzan con otra cita aparecen deshabilitados.
 */
export function AgendarFechaScreen({ navigation }: Props) {
  const { servicios } = useCatalogo();
  const { borrador, actualizarBorrador } = useAgenda();
  const hoy = hoyNegocio();
  const [anioHoy, mesHoy] = hoy.split('-').map(Number);

  const [mesVisible, setMesVisible] = useState(() => {
    const base = borrador.fecha ?? hoy;
    const [a, m] = base.split('-').map(Number);
    return { anio: a, mes: m - 1 };
  });
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { duracionTotalMin } = resumirSeleccion(servicios.filter((s) => borrador.servicioIds.includes(s.id)));
  const semanas = useMemo(() => semanasDelMes(mesVisible.anio, mesVisible.mes), [mesVisible]);

  const indiceMes = mesVisible.anio * 12 + mesVisible.mes;
  const indiceHoy = anioHoy * 12 + (mesHoy - 1);
  const puedeRetroceder = indiceMes > indiceHoy;
  const puedeAvanzar = indiceMes < indiceHoy + MESES_ADELANTE;

  const diaSeleccionable = (ymd: string) => ymd >= hoy && Boolean(HORARIO[diaSemana(ymd) as keyof typeof HORARIO]);

  useEffect(() => {
    if (!borrador.fecha) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    citasService
      .consultarDisponibilidad(borrador.fecha, duracionTotalMin)
      .then((h) => vigente && setHorarios(h))
      .catch((e) => vigente && setError(mensajeDeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [borrador.fecha, duracionTotalMin]);

  const moverMes = (delta: number) =>
    setMesVisible(({ anio, mes }) => {
      const total = anio * 12 + mes + delta;
      return { anio: Math.floor(total / 12), mes: total % 12 };
    });

  const disponibles = horarios.filter((h) => h.disponible).length;

  return (
    <Pantalla
      footer={
        <BarraInferior
          etiqueta="CITA ELEGIDA"
          valor={borrador.fecha ? formatoFechaCorta(borrador.fecha) : 'Elegí un día'}
          destacado={borrador.hora ? `${borrador.hora} hs` : undefined}
          accion={
            <Boton
              titulo="Continuar"
              iconoDerecha="arrow-right"
              compacto
              deshabilitado={!borrador.fecha || !borrador.hora}
              onPress={() => navigation.navigate('AgendarConfirmacion')}
              style={styles.boton}
            />
          }
        />
      }
    >
      <Encabezado titulo="Fecha y hora" onVolver={() => navigation.goBack()} />
      <IndicadorPasos actual={2} />

      <View style={styles.mesFila}>
        <Pressable onPress={() => moverMes(-1)} disabled={!puedeRetroceder} hitSlop={10} accessibilityLabel="Mes anterior">
          <Feather name="chevron-left" size={20} color={puedeRetroceder ? colors.wisteriaBlue : colors.cardAlt} />
        </Pressable>
        <Text style={styles.mes}>
          {MESES[mesVisible.mes]} {mesVisible.anio}
        </Text>
        <Pressable onPress={() => moverMes(1)} disabled={!puedeAvanzar} hitSlop={10} accessibilityLabel="Mes siguiente">
          <Feather name="chevron-right" size={20} color={puedeAvanzar ? colors.wisteriaBlue : colors.cardAlt} />
        </Pressable>
      </View>

      <View style={styles.calendario}>
        <View style={styles.semana}>
          {DIAS.map((d, i) => (
            <Text key={i} style={styles.diaNombre}>
              {d}
            </Text>
          ))}
        </View>
        {semanas.map((semana, i) => (
          <View key={i} style={styles.semana}>
            {semana.map((ymd, j) => {
              if (!ymd) return <View key={j} style={styles.celda} />;
              const habil = diaSeleccionable(ymd);
              const activo = borrador.fecha === ymd;
              return (
                <Pressable
                  key={ymd}
                  style={styles.celda}
                  disabled={!habil}
                  onPress={() => actualizarBorrador({ fecha: ymd, hora: null })}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !habil, selected: activo }}
                  accessibilityLabel={formatoFechaCorta(ymd)}
                >
                  <View style={[styles.numero, activo && styles.numeroActivo]}>
                    <Text style={[styles.numeroTexto, !habil && styles.numeroInactivo, activo && styles.numeroTextoActivo]}>
                      {Number(ymd.slice(8))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.subtitulo}>Horarios disponibles</Text>
      {!borrador.fecha ? (
        <Text style={styles.ayuda}>Elegí un día en el calendario para ver los horarios.</Text>
      ) : cargando ? (
        <ActivityIndicator color={colors.petalPink} style={styles.cargando} />
      ) : error ? (
        <Text style={styles.ayuda}>{error}</Text>
      ) : disponibles === 0 ? (
        <Text style={styles.ayuda}>
          No quedan horarios con espacio para {formatoDuracion(duracionTotalMin)} este día. Probá con otra fecha.
        </Text>
      ) : (
        <View style={styles.horarios}>
          {horarios.map((h) => {
            const activo = borrador.hora === h.hora;
            return (
              <Pressable
                key={h.hora}
                disabled={!h.disponible}
                onPress={() => actualizarBorrador({ hora: h.hora })}
                style={[styles.horario, activo && styles.horarioActivo, !h.disponible && styles.horarioInactivo]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !h.disponible, selected: activo }}
              >
                <Text
                  style={[
                    styles.horarioTexto,
                    activo && styles.horarioTextoActivo,
                    !h.disponible && styles.horarioTextoInactivo,
                  ]}
                >
                  {h.hora}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  boton: { height: 44, paddingHorizontal: 18 },
  mesFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  mes: { fontFamily: fonts.display, fontSize: 16, color: colors.white },
  calendario: { borderWidth: 1, borderColor: colors.wisteriaBlue, borderRadius: radius.lg, padding: 10 },
  semana: { flexDirection: 'row' },
  diaNombre: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 11, color: colors.wisteriaBlue, paddingVertical: 8 },
  celda: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  numero: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  numeroActivo: { backgroundColor: colors.petalPink },
  numeroTexto: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
  numeroInactivo: { color: colors.textSubtle, opacity: 0.5 },
  numeroTextoActivo: { color: colors.dark, fontFamily: fonts.bold },
  subtitulo: { fontFamily: fonts.display, fontSize: 16, color: colors.white, marginTop: 20, marginBottom: 12 },
  ayuda: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  cargando: { marginTop: 16 },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horario: {
    width: '31.5%',
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.wisteriaBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioActivo: { backgroundColor: colors.petalPink, borderColor: colors.petalPink },
  horarioInactivo: { borderColor: colors.cardAlt, backgroundColor: colors.card },
  horarioTexto: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  horarioTextoActivo: { color: colors.dark },
  horarioTextoInactivo: { color: colors.textSubtle, textDecorationLine: 'line-through' },
});

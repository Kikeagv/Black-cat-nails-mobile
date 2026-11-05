import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Encabezado, EstadoCargando, EstadoError, EstadoVacio, Pantalla } from '@/components';
import { useAgenda, useAuth } from '@/context';
import { formatoFechaCorta, formatoMonto, partesNegocio } from '@/domain';
import { useActividad } from '@/hooks/useActividad';
import { ClientaStackParams } from '@/navigation/tipos';
import { colors, fonts, radius } from '@/theme/tokens';
import { Actividad, TipoActividad } from '@/types';

type Props = NativeStackScreenProps<ClientaStackParams, 'Actividad'>;

type Filtro = 'todo' | 'citas' | 'cuenta';

const ICONO: Record<TipoActividad, keyof typeof Feather.glyphMap> = {
  registro: 'user-plus',
  inicio_sesion: 'log-in',
  cita_creada: 'calendar',
  cita_cancelada: 'x-circle',
  cita_estado: 'check-circle',
  perfil_actualizado: 'edit-2',
  foto_actualizada: 'camera',
  favorito_agregado: 'heart',
};

const DE_CITAS: TipoActividad[] = ['cita_creada', 'cita_cancelada', 'cita_estado'];

/**
 * Historial de actividad (Foro 2, requisito 4): lee usuarias/{uid}/actividad de
 * Firestore en tiempo real, agrupado por día, con un resumen de las citas.
 */
export function ActividadScreen({ navigation }: Props) {
  const { usuaria } = useAuth();
  const { citas } = useAgenda();
  const { registros, cargando, error, reintentar } = useActividad(usuaria?.id);
  const [filtro, setFiltro] = useState<Filtro>('todo');

  const visibles = useMemo(
    () =>
      registros.filter((r) =>
        filtro === 'todo' ? true : filtro === 'citas' ? DE_CITAS.includes(r.tipo) : !DE_CITAS.includes(r.tipo)
      ),
    [registros, filtro]
  );

  const porDia = useMemo(() => {
    const grupos = new Map<string, Actividad[]>();
    visibles.forEach((r) => {
      const dia = partesNegocio(r.fecha).ymd;
      grupos.set(dia, [...(grupos.get(dia) ?? []), r]);
    });
    return [...grupos.entries()];
  }, [visibles]);

  const completadas = citas.filter((c) => c.estado === 'completada');
  const invertido = completadas.reduce((acc, c) => acc + (c.montoCobrado ?? c.montoTotal), 0);

  return (
    <Pantalla>
      <Encabezado titulo="Mi actividad" onVolver={() => navigation.goBack()} />

      <View style={styles.resumen}>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{citas.length}</Text>
          <Text style={styles.kpiEtiqueta}>citas en total</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{completadas.length}</Text>
          <Text style={styles.kpiEtiqueta}>completadas</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{formatoMonto(invertido)}</Text>
          <Text style={styles.kpiEtiqueta}>en servicios</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
        <Chip texto="Todo" activo={filtro === 'todo'} onPress={() => setFiltro('todo')} />
        <Chip texto="Citas" activo={filtro === 'citas'} onPress={() => setFiltro('citas')} />
        <Chip texto="Mi cuenta" activo={filtro === 'cuenta'} onPress={() => setFiltro('cuenta')} />
      </ScrollView>

      {error ? (
        <EstadoError mensaje={error} onReintentar={reintentar} />
      ) : cargando ? (
        <EstadoCargando texto="Leyendo tu historial…" />
      ) : porDia.length === 0 ? (
        <EstadoVacio titulo="Sin movimientos" mensaje="Aquí vas a ver tus citas, cambios de perfil e inicios de sesión." />
      ) : (
        porDia.map(([dia, lista]) => (
          <View key={dia} style={styles.grupo}>
            <Text style={styles.dia}>{formatoFechaCorta(dia)}</Text>
            {lista.map((r) => (
              <View key={r.id} style={styles.fila}>
                <View style={[styles.icono, DE_CITAS.includes(r.tipo) && styles.iconoCita]}>
                  <Feather name={ICONO[r.tipo] ?? 'activity'} size={16} color={colors.white} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.descripcion}>{r.descripcion}</Text>
                  <Text style={styles.hora}>{partesNegocio(r.fecha).hora}</Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  resumen: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  kpi: { flex: 1, backgroundColor: colors.berryCrush, borderRadius: radius.lg, padding: 14 },
  kpiValor: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  kpiEtiqueta: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  filtros: { gap: 8, paddingBottom: 16 },
  grupo: { marginBottom: 18, gap: 8 },
  dia: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  icono: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  iconoCita: { backgroundColor: colors.berryCrush },
  descripcion: { fontFamily: fonts.regular, fontSize: 14, color: colors.white, lineHeight: 19 },
  hora: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle, marginTop: 2 },
});

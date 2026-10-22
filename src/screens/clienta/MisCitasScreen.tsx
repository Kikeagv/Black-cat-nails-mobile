import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, EstadoCargando, EstadoError, EstadoVacio, Pantalla, TarjetaCita } from '@/components';
import { CANCELACION_MIN_HORAS } from '@/config';
import { useAgenda } from '@/context';
import { cumpleAnticipacionCancelacion, evaluarAvisoRetoque, formatoFechaCorta, formatoFechaHora } from '@/domain';
import { ClientaStackParams, ClientaTabsParams } from '@/navigation/tipos';
import { mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { Cita } from '@/types';
import { avisar, confirmar } from '@/utils/dialogos';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientaTabsParams, 'MisCitas'>,
  NativeStackScreenProps<ClientaStackParams>
>;

type Pestana = 'proximas' | 'historial';

/** Figma: m5-mis-citas-proximas, m5-mis-citas-historial y m5-mis-citas-empty. */
export function MisCitasScreen({ navigation }: Props) {
  const { citas, cargando, error, recargar, cambiarEstado } = useAgenda();
  const [pestana, setPestana] = useState<Pestana>('proximas');
  const [procesando, setProcesando] = useState<string | null>(null);

  const ahora = Date.now();
  const proximas = useMemo(
    () => citas.filter((c) => ['solicitada', 'confirmada', 'en_curso'].includes(c.estado) && Date.parse(c.fin) > ahora),
    [citas, ahora]
  );
  const historial = useMemo(
    () => citas.filter((c) => !proximas.includes(c)).sort((a, b) => b.inicio.localeCompare(a.inicio)),
    [citas, proximas]
  );
  const retoque = useMemo(() => evaluarAvisoRetoque(citas), [citas]);

  const cancelar = async (cita: Cita) => {
    // La regla de 12 horas se valida antes de preguntar, y otra vez en la capa de datos.
    if (!cumpleAnticipacionCancelacion(cita.inicio)) {
      avisar(
        'Ya no se puede cancelar desde la app',
        `Las cancelaciones se hacen con al menos ${CANCELACION_MIN_HORAS} horas de anticipación. Escribile al salón para reprogramar.`
      );
      return;
    }
    const ok = await confirmar('Cancelar cita', `¿Querés cancelar tu cita del ${formatoFechaHora(cita.inicio)}?`, {
      aceptar: 'Sí, cancelar',
      cancelar: 'No, mantener',
      destructivo: true,
    });
    if (!ok) return;
    setProcesando(cita.id);
    try {
      await cambiarEstado(cita.id, 'cancelada');
    } catch (e) {
      avisar('No se pudo cancelar', mensajeDeError(e));
    } finally {
      setProcesando(null);
    }
  };

  const reprogramar = async (cita: Cita) => {
    const ok = await confirmar(
      'Reprogramar',
      'Elegí un horario nuevo con los mismos servicios. Después cancelá esta cita para liberar el espacio.',
      { aceptar: 'Elegir nuevo horario', cancelar: 'Volver' }
    );
    if (ok) navigation.navigate('AgendarServicios', { servicioIds: cita.servicios.map((s) => s.servicioId) });
  };

  const lista = pestana === 'proximas' ? proximas : historial;

  return (
    <Pantalla onRefrescar={recargar}>
      <Text style={styles.titulo}>Mis citas</Text>

      <View style={styles.segmento} accessibilityRole="tablist">
        {(['proximas', 'historial'] as Pestana[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPestana(p)}
            style={[styles.opcion, pestana === p && styles.opcionActiva]}
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === p }}
          >
            <Text style={[styles.opcionTexto, pestana === p && styles.opcionTextoActivo]}>
              {p === 'proximas' ? 'Próximas' : 'Historial'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : cargando ? (
        <EstadoCargando texto="Cargando tus citas…" />
      ) : lista.length === 0 && !(pestana === 'historial' && retoque.mostrar) ? (
        <EstadoVacio
          titulo={pestana === 'proximas' ? 'No tenés citas próximas' : 'Todavía no hay historial'}
          mensaje="Agendá tu primera cita y dejá tus uñas perfectas con nuestras especialistas."
          accion="Agendar cita"
          onAccion={() => navigation.navigate('AgendarServicios')}
        />
      ) : (
        <View style={styles.lista}>
          {lista.map((c) => (
            <TarjetaCita
              key={c.id}
              cita={c}
              acciones={
                pestana === 'proximas' && c.estado !== 'en_curso' ? (
                  <>
                    <Boton
                      titulo="Reprogramar"
                      variante="secundario"
                      compacto
                      style={styles.flex}
                      onPress={() => reprogramar(c)}
                    />
                    <Boton
                      titulo="Cancelar"
                      variante="contorno"
                      compacto
                      style={styles.flex}
                      cargando={procesando === c.id}
                      onPress={() => cancelar(c)}
                    />
                  </>
                ) : undefined
              }
            />
          ))}

          {pestana === 'historial' && retoque.mostrar && (
            <View style={styles.retoque}>
              <Text style={styles.retoqueTitulo}>Es hora de tu retoque ✨</Text>
              <Text style={styles.retoqueTexto}>
                {retoque.vencido
                  ? `Tu retoque sugerido era el ${formatoFechaCorta(retoque.fechaRetoque!)}. ¡Agendá tu próxima cita para mantener tus uñas impecables!`
                  : `Tu fecha sugerida de retoque es el ${formatoFechaCorta(retoque.fechaRetoque!)}. Agendá con anticipación para asegurar tu espacio.`}
              </Text>
              <Boton titulo="+ Agendar cita" compacto onPress={() => navigation.navigate('AgendarServicios')} />
            </View>
          )}
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.white, paddingTop: 20, paddingBottom: 16 },
  segmento: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcion: { flex: 1, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  opcionActiva: { backgroundColor: colors.petalPink },
  opcionTexto: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  opcionTextoActivo: { fontFamily: fonts.semibold, color: colors.dark },
  lista: { gap: 12 },
  retoque: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.petalPink,
    padding: 16,
    gap: 10,
    shadowColor: colors.petalPink,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  retoqueTitulo: { fontFamily: fonts.display, fontSize: 16, color: colors.white },
  retoqueTexto: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});

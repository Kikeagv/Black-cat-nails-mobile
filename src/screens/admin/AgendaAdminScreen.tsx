import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton, Chip, EstadoCargando, EstadoError, EstadoVacio, Pantalla, TarjetaCita } from '@/components';
import { useAgenda, useAuth } from '@/context';
import { ETIQUETAS_ESTADO, formatoMonto, hoyNegocio, partesNegocio, sumarDias, TRANSICIONES, formatoFechaCorta } from '@/domain';
import { reiniciarDb } from '@/data/localDb';
import { mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { Cita, EstadoCita } from '@/types';
import { avisar, confirmar } from '@/utils/dialogos';

const ACCION: Partial<Record<EstadoCita, string>> = {
  confirmada: 'Confirmar',
  en_curso: 'Iniciar',
  completada: 'Completar',
  inasistencia: 'No asistió',
  cancelada: 'Cancelar',
};

/**
 * Vista de la administradora: agenda de los próximos días con las transiciones
 * de estado que permite la máquina de estados (rol admin).
 */
export function AgendaAdminScreen() {
  const { usuaria } = useAuth();
  const { citas, cargando, error, recargar, cambiarEstado } = useAgenda();
  const hoy = hoyNegocio();
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i)), [hoy]);
  const [dia, setDia] = useState(hoy);
  const [procesando, setProcesando] = useState<string | null>(null);

  const delDia = citas.filter((c) => partesNegocio(c.inicio).ymd === dia);
  const sinConfirmar = citas.filter((c) => c.estado === 'solicitada' && Date.parse(c.inicio) > Date.now()).length;
  const deHoy = citas.filter((c) => partesNegocio(c.inicio).ymd === hoy && c.estado !== 'cancelada');
  const ingresoEstimadoHoy = deHoy.reduce((acc, c) => acc + c.montoTotal, 0);

  const ejecutar = async (cita: Cita, hacia: EstadoCita) => {
    if (hacia === 'inasistencia' || hacia === 'cancelada') {
      const ok = await confirmar(ACCION[hacia]!, `¿Marcar la cita de ${cita.clientaNombre} como "${ETIQUETAS_ESTADO[hacia]}"?`, {
        aceptar: 'Sí',
        destructivo: true,
      });
      if (!ok) return;
    }
    setProcesando(cita.id + hacia);
    try {
      await cambiarEstado(cita.id, hacia);
    } catch (e) {
      avisar('No se pudo actualizar', mensajeDeError(e));
    } finally {
      setProcesando(null);
    }
  };

  return (
    <Pantalla onRefrescar={recargar}>
      <Text style={styles.titulo}>Agenda</Text>
      <Text style={styles.sub}>Hola, {usuaria?.nombre.split(' ')[0]}. Así viene tu semana.</Text>

      <View style={styles.kpis}>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{sinConfirmar}</Text>
          <Text style={styles.kpiEtiqueta}>sin confirmar</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{deHoy.length}</Text>
          <Text style={styles.kpiEtiqueta}>citas hoy</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValor}>{formatoMonto(ingresoEstimadoHoy)}</Text>
          <Text style={styles.kpiEtiqueta}>estimado hoy</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
        {dias.map((d) => (
          <Chip key={d} texto={d === hoy ? 'Hoy' : formatoFechaCorta(d)} activo={dia === d} onPress={() => setDia(d)} />
        ))}
      </ScrollView>

      {error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : cargando ? (
        <EstadoCargando />
      ) : delDia.length === 0 ? (
        <EstadoVacio titulo="Día libre" mensaje="No hay citas agendadas para este día." />
      ) : (
        <View style={styles.lista}>
          {delDia.map((c) => {
            const siguientes = TRANSICIONES[c.estado];
            return (
              <TarjetaCita
                key={c.id}
                cita={c}
                subtitulo={`${partesNegocio(c.inicio).hora} - ${partesNegocio(c.fin).hora} · ${c.clientaNombre ?? ''}`}
                acciones={
                  siguientes.length ? (
                    <View style={styles.acciones}>
                      {siguientes.map((e) => (
                        <Boton
                          key={e}
                          titulo={ACCION[e] ?? e}
                          compacto
                          variante={e === 'cancelada' || e === 'inasistencia' ? 'contorno' : 'secundario'}
                          cargando={procesando === c.id + e}
                          onPress={() => ejecutar(c, e)}
                        />
                      ))}
                    </View>
                  ) : undefined
                }
              />
            );
          })}
        </View>
      )}
    </Pantalla>
  );
}

export function PerfilAdminScreen() {
  const { usuaria, logout } = useAuth();
  const { recargar } = useAgenda();

  const restaurar = async () => {
    const ok = await confirmar(
      'Restaurar datos de demostración',
      'Se borran las citas y cuentas creadas en este dispositivo y se vuelve al estado inicial.',
      { aceptar: 'Restaurar', destructivo: true }
    );
    if (!ok) return;
    await reiniciarDb();
    await recargar();
    avisar('Listo', 'Los datos de demostración se restauraron.');
  };

  return (
    <Pantalla>
      <Text style={styles.titulo}>Mi cuenta</Text>
      <View style={styles.tarjeta}>
        <Text style={styles.nombre}>{usuaria?.nombre}</Text>
        <Text style={styles.sub}>{usuaria?.correo}</Text>
        <View style={styles.rol}>
          <Text style={styles.rolTexto}>ADMINISTRADORA</Text>
        </View>
      </View>
      <Text style={styles.nota}>
        La gestión completa de servicios, inventario, clientas y reportes está en el panel web. Desde el teléfono podés
        llevar la agenda del día.
      </Text>
      <Boton titulo="Restaurar datos de demostración" icono="rotate-ccw" variante="secundario" onPress={restaurar} style={styles.restaurar} />
      <Boton
        titulo="Cerrar sesión"
        icono="log-out"
        variante="contorno"
        onPress={async () => {
          if (await confirmar('Cerrar sesión', '¿Querés salir de tu cuenta?', { aceptar: 'Salir', destructivo: true })) {
            await logout();
          }
        }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.white, paddingTop: 20 },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  kpis: { flexDirection: 'row', gap: 10, marginVertical: 18 },
  kpi: { flex: 1, backgroundColor: colors.berryCrush, borderRadius: radius.lg, padding: 14 },
  kpiValor: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  kpiEtiqueta: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  dias: { gap: 8, paddingBottom: 16 },
  lista: { gap: 12 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginVertical: 18, gap: 2 },
  nombre: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  rol: { alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: colors.wisteriaBlue, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  rolTexto: { fontFamily: fonts.semibold, fontSize: 11, color: colors.wisteriaBlue },
  restaurar: { marginBottom: 12 },
  nota: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 20 },
});

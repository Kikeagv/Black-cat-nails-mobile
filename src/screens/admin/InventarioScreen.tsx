import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EstadoCargando, EstadoError, EstadoVacio, Pantalla } from '@/components';
import { useCatalogo } from '@/context';
import { calcularRendimientoClientas } from '@/domain';
import { inventarioService } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { EstadoInsumo, Insumo } from '@/types';

const COLOR: Record<EstadoInsumo, string> = { ok: '#6FCF97', bajo: '#F2C94C', critico: colors.error };
const ETIQUETA: Record<EstadoInsumo, string> = { ok: 'Suficiente', bajo: 'Bajo', critico: 'Crítico' };

/**
 * Inventario de insumos (módulo secundario de la administradora).
 * Escucha `insumos` en Firestore: al completar una cita en la agenda, la
 * existencia baja aquí en el mismo momento.
 */
export function InventarioScreen() {
  const { servicios } = useCatalogo();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setCargando(true);
    setError(null);
    return inventarioService.observarInsumos(
      (lista) => {
        setInsumos(lista);
        setCargando(false);
      },
      (m) => {
        setError(m);
        setCargando(false);
      }
    );
  }, [version]);

  const alertas = insumos.filter((i) => i.estado !== 'ok').length;

  return (
    <Pantalla>
      <Text style={styles.titulo}>Inventario</Text>
      <Text style={styles.sub}>
        {alertas === 0 ? 'Todo en orden.' : `${alertas} ${alertas === 1 ? 'insumo necesita' : 'insumos necesitan'} reposición.`}
      </Text>

      {error ? (
        <EstadoError mensaje={error} onReintentar={() => setVersion((v) => v + 1)} />
      ) : cargando ? (
        <EstadoCargando />
      ) : insumos.length === 0 ? (
        <EstadoVacio titulo="Sin insumos" mensaje="Cargá los datos de demostración con npm run seed." />
      ) : (
        <View style={styles.lista}>
          {insumos.map((i) => {
            const estado = i.estado ?? 'ok';
            const rendimiento = calcularRendimientoClientas(i, servicios);
            const porcentaje = Math.min(1, i.existencia / Math.max(i.minimo * 3, 1));
            return (
              <View key={i.id} style={styles.tarjeta}>
                <View style={styles.fila}>
                  <Text style={styles.nombre}>{i.nombre}</Text>
                  <View style={[styles.badge, { borderColor: COLOR[estado] }]}>
                    <Text style={[styles.badgeTexto, { color: COLOR[estado] }]}>{ETIQUETA[estado]}</Text>
                  </View>
                </View>
                <View style={styles.barra}>
                  <View style={[styles.relleno, { width: `${porcentaje * 100}%`, backgroundColor: COLOR[estado] }]} />
                </View>
                <Text style={styles.meta}>
                  {i.existencia} {i.unidad} · mínimo {i.minimo} {i.unidad}
                  {rendimiento ? ` · alcanza para ~${rendimiento.clientasAtendibles} clientas` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fonts.display, fontSize: 28, color: colors.white, paddingTop: 20 },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 18 },
  lista: { gap: 12 },
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  nombre: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontFamily: fonts.semibold, fontSize: 11 },
  barra: { height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  relleno: { height: 6, borderRadius: 3 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
});

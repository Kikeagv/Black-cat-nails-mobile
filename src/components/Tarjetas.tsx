import { Feather } from '@expo/vector-icons';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatoDuracion, formatoMonto } from '@/domain';
import { colors, fonts, radius } from '@/theme/tokens';
import { Diseno, Servicio } from '@/types';

/** Imagen ilustrativa de cada servicio en el inicio (tomadas de la galería). */
const MINIATURAS: Record<string, ImageSourcePropType> = {
  srv_1: require('../../assets/images/disenos/minimal-cats.jpg'),
  srv_2: require('../../assets/images/disenos/mariposa-holografica.jpg'),
  srv_3: require('../../assets/images/disenos/gotico-frances.jpg'),
  srv_4: require('../../assets/images/disenos/rosas-relieve.jpg'),
  srv_5: require('../../assets/images/disenos/auroras-boreales.jpg'),
  srv_6: require('../../assets/images/disenos/perlas-midnight.jpg'),
};

/** Fila del catálogo de servicios en la pantalla de inicio. */
export function TarjetaServicio({ servicio, onPress }: { servicio: Servicio; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.servicio, pressed && styles.presionado]}>
      {MINIATURAS[servicio.id] && <Image source={MINIATURAS[servicio.id]} style={styles.miniatura} />}
      <View style={styles.flex}>
        <Text style={styles.nombre}>{servicio.nombre}</Text>
        <Text style={styles.meta}>
          {formatoDuracion(servicio.duracionMin)} • <Text style={styles.precio}>{formatoMonto(servicio.precio)}</Text>
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

/** Fila con casilla del paso 1 del agendamiento. */
export function FilaServicioSeleccionable({
  servicio,
  seleccionado,
  onToggle,
}: {
  servicio: Servicio;
  seleccionado: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: seleccionado }}
      style={[styles.seleccionable, seleccionado && styles.seleccionableActivo]}
    >
      <View style={[styles.check, seleccionado && styles.checkActivo]}>
        {seleccionado && <Feather name="check" size={16} color={colors.dark} />}
      </View>
      <View style={styles.flex}>
        <Text style={styles.nombre}>{servicio.nombre}</Text>
        <Text style={styles.meta}>{formatoDuracion(servicio.duracionMin)}</Text>
      </View>
      <Text style={[styles.precioGrande, !seleccionado && styles.precioInactivo]}>{formatoMonto(servicio.precio)}</Text>
    </Pressable>
  );
}

/** Tarjeta de la galería: foto, favorito, nombre, categoría y precio base. */
export function TarjetaDiseno({
  diseno,
  favorito,
  onPress,
  onFavorito,
  ancho,
}: {
  diseno: Diseno;
  favorito: boolean;
  onPress: () => void;
  onFavorito: () => void;
  ancho: number;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: ancho }} accessibilityLabel={`Ver ${diseno.nombre}`}>
      <View>
        <Image source={diseno.imagen} style={[styles.foto, { width: ancho, height: ancho }]} />
        <Pressable
          onPress={onFavorito}
          hitSlop={8}
          style={styles.corazon}
          accessibilityRole="button"
          accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Feather name="heart" size={16} color={favorito ? colors.petalPink : colors.white} />
        </Pressable>
      </View>
      <Text style={styles.nombreDiseno} numberOfLines={1}>
        {diseno.nombre}
      </Text>
      <View style={styles.filaPrecio}>
        <Text style={styles.meta}>{diseno.categoria}</Text>
        <Text style={styles.desde}>Desde {formatoMonto(diseno.precioDesde)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  presionado: { opacity: 0.8 },
  servicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
  },
  miniatura: { width: 48, height: 48, borderRadius: radius.md },
  nombre: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  precio: { fontFamily: fonts.semibold, color: colors.petalPink },
  seleccionable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  seleccionableActivo: { borderColor: colors.petalPink, backgroundColor: 'rgba(181,68,110,0.12)' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.wisteriaBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActivo: { backgroundColor: colors.petalPink, borderColor: colors.petalPink },
  precioGrande: { fontFamily: fonts.bold, fontSize: 15, color: colors.petalPink },
  precioInactivo: { color: colors.wisteriaBlue },
  foto: { borderRadius: radius.lg, backgroundColor: colors.card },
  corazon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(25,19,8,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreDiseno: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, marginTop: 8, marginLeft: 4 },
  filaPrecio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 4 },
  desde: { fontFamily: fonts.semibold, fontSize: 12, color: colors.petalPink, marginTop: 3 },
});

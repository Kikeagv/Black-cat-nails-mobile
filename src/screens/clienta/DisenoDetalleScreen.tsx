import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton } from '@/components';
import { useCatalogo } from '@/context';
import { formatoMonto } from '@/domain';
import { ClientaStackParams } from '@/navigation/tipos';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<ClientaStackParams, 'DisenoDetalle'>;

/** Figma: Detail Modal Screen. Hoja inferior sobre la galería oscurecida. */
export function DisenoDetalleScreen({ navigation, route }: Props) {
  const { disenos, servicios, favoritos, alternarFavorito } = useCatalogo();
  const insets = useSafeAreaInsets();
  const diseno = disenos.find((d) => d.id === route.params.disenoId);

  if (!diseno) return null;
  const favorito = favoritos.includes(diseno.id);
  const servicio = servicios.find((s) => s.id === diseno.servicioSugeridoId);

  return (
    <View style={styles.root}>
      <Pressable style={styles.fondo} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar detalle" />
      <View style={[styles.hoja, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.asa} />
        <ScrollView bounces={false}>
          <View>
            <Image source={diseno.imagenDetalle ?? diseno.imagen} style={styles.foto} />
            <Pressable
              style={styles.corazon}
              onPress={() => alternarFavorito(diseno.id)}
              accessibilityRole="button"
              accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Feather name="heart" size={22} color={favorito ? colors.petalPink : colors.white} />
            </Pressable>
          </View>
          <View style={styles.cuerpo}>
            <View style={styles.filaTitulo}>
              <Text style={styles.titulo}>{diseno.nombre}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{diseno.categoria.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.precio}>Desde {formatoMonto(diseno.precioDesde)}</Text>
            <Text style={styles.descripcion}>{diseno.descripcion}</Text>
            {servicio && (
              <Text style={styles.sugerido}>
                Servicio sugerido: <Text style={styles.sugeridoNombre}>{servicio.nombre}</Text>
              </Text>
            )}
          </View>
        </ScrollView>
        <View style={styles.pie}>
          <Boton
            titulo="Agendar este diseño"
            icono="calendar"
            onPress={() => {
              navigation.goBack();
              navigation.navigate('AgendarServicios', { servicioIds: [diseno.servicioSugeridoId] });
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  hoja: {
    backgroundColor: colors.dark,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  asa: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textSubtle, marginVertical: 10 },
  foto: { width: '100%', height: 200 },
  corazon: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: { padding: 20, gap: 10 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titulo: { flex: 1, fontFamily: fonts.display, fontSize: 26, color: colors.white },
  badge: { borderWidth: 1, borderColor: colors.wisteriaBlue, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgeTexto: { fontFamily: fonts.semibold, fontSize: 11, color: colors.wisteriaBlue },
  precio: { fontFamily: fonts.bold, fontSize: 18, color: colors.petalPink },
  descripcion: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  sugerido: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  sugeridoNombre: { fontFamily: fonts.semibold, color: colors.white },
  pie: { paddingHorizontal: 20, paddingTop: 8 },
});

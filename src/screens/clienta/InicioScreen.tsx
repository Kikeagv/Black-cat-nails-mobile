import { Feather } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, EstadoCargando, EstadoError, Pantalla, TarjetaServicio } from '@/components';
import { useAgenda, useAuth, useCatalogo } from '@/context';
import { evaluarAvisoRetoque, formatoFechaHora } from '@/domain';
import { ClientaStackParams, ClientaTabsParams } from '@/navigation/tipos';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientaTabsParams, 'Inicio'>,
  NativeStackScreenProps<ClientaStackParams>
>;

/** Figma: home-catalogo. Lo primero que ve la clienta es su próxima cita y el acceso a agendar. */
export function InicioScreen({ navigation }: Props) {
  const { usuaria } = useAuth();
  const { servicios, disenos, cargando, error, recargar } = useCatalogo();
  const { citas, recargar: recargarCitas, cargando: cargandoCitas } = useAgenda();

  const proxima = useMemo(
    () =>
      citas.find((c) => ['solicitada', 'confirmada'].includes(c.estado) && Date.parse(c.inicio) > Date.now()),
    [citas]
  );
  const retoque = useMemo(() => evaluarAvisoRetoque(citas), [citas]);
  const primerNombre = usuaria?.nombre.split(' ')[0] ?? '';

  const agendar = (servicioIds?: string[]) => navigation.navigate('AgendarServicios', { servicioIds });

  if (error) return <Pantalla><EstadoError mensaje={error} onReintentar={recargar} /></Pantalla>;

  return (
    <View style={styles.flex}>
      <Pantalla
        contentStyle={styles.contenido}
        onRefrescar={() => {
          recargar();
          recargarCitas();
        }}
      >
        <View style={styles.saludo}>
          <Text style={styles.hola}>Hola, {primerNombre}</Text>
          <Text style={styles.sub}>¿Qué diseño creamos hoy?</Text>
        </View>

        {proxima ? (
          <Pressable style={styles.proxima} onPress={() => navigation.navigate('MisCitas')}>
            <View style={styles.proximaFila}>
              <View style={styles.proximaEtiqueta}>
                <Feather name="calendar" size={14} color={colors.white} />
                <Text style={styles.proximaEtiquetaTexto}>TU PRÓXIMA CITA</Text>
              </View>
              <View style={styles.verDetalle}>
                <Text style={styles.verDetalleTexto}>Ver detalle</Text>
              </View>
            </View>
            <Text style={styles.proximaFecha}>{formatoFechaHora(proxima.inicio)}</Text>
            <Text style={styles.proximaServicios}>{proxima.servicios.map((s) => s.nombre).join(' + ')}</Text>
          </Pressable>
        ) : retoque.mostrar ? (
          <View style={[styles.proxima, styles.retoque]}>
            <Text style={styles.retoqueTitulo}>Es hora de tu retoque ✨</Text>
            <Text style={styles.retoqueTexto}>
              {retoque.vencido
                ? 'Ya pasó tu fecha sugerida de mantenimiento. Agendá para mantener tus uñas impecables.'
                : 'Se acerca tu fecha sugerida de mantenimiento. Agendá con tiempo para asegurar tu espacio.'}
            </Text>
          </View>
        ) : (
          !cargandoCitas && (
            <View style={[styles.proxima, styles.sinCita]}>
              <Text style={styles.proximaEtiquetaTexto}>AÚN NO TENÉS CITAS PRÓXIMAS</Text>
              <Text style={styles.proximaServicios}>Elegí tus servicios y reservá en menos de un minuto.</Text>
            </View>
          )
        )}

        <Text style={styles.seccion}>Servicios</Text>
        {cargando ? (
          <EstadoCargando texto="Cargando servicios…" />
        ) : (
          <View style={styles.lista}>
            {servicios.map((s) => (
              <TarjetaServicio key={s.id} servicio={s} onPress={() => agendar([s.id])} />
            ))}
          </View>
        )}

        <View style={styles.seccionFila}>
          <Text style={styles.seccion}>Diseños destacados</Text>
          <Pressable onPress={() => navigation.navigate('Disenos')} hitSlop={8}>
            <Text style={styles.verTodos}>Ver todos</Text>
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={disenos}
          keyExtractor={(d) => d.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carrusel}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('DisenoDetalle', { disenoId: item.id })}
              accessibilityLabel={`Ver ${item.nombre}`}
            >
              <Image source={item.imagen} style={styles.destacado} />
            </Pressable>
          )}
        />
      </Pantalla>

      <View style={styles.flotante} pointerEvents="box-none">
        <Boton titulo="Agendar cita" icono="plus" onPress={() => agendar()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dark },
  contenido: { paddingBottom: 96 },
  saludo: { paddingTop: 20, paddingBottom: 16 },
  hola: { fontFamily: fonts.display, fontSize: 28, color: colors.white },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  proxima: { backgroundColor: colors.berryCrush, borderRadius: radius.lg, padding: 16, gap: 6 },
  proximaFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proximaEtiqueta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proximaEtiquetaTexto: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white, letterSpacing: 0.5 },
  verDetalle: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  verDetalleTexto: { fontFamily: fonts.medium, fontSize: 11, color: colors.white },
  proximaFecha: { fontFamily: fonts.display, fontSize: 24, color: colors.white, marginTop: 6 },
  proximaServicios: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  retoque: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.petalPink },
  retoqueTitulo: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  retoqueTexto: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  sinCita: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  seccion: { fontFamily: fonts.display, fontSize: 22, color: colors.white, marginTop: 24, marginBottom: 12 },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTodos: { fontFamily: fonts.medium, fontSize: 13, color: colors.wisteriaBlue, marginTop: 12 },
  lista: { gap: 10 },
  carrusel: { gap: 10 },
  destacado: { width: 100, height: 100, borderRadius: radius.md },
  flotante: { position: 'absolute', left: 20, right: 20, bottom: 12 },
});

import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BotonIcono,
  CampoTexto,
  Chip,
  Encabezado,
  EstadoCargando,
  EstadoError,
  EstadoVacio,
  TarjetaDiseno,
} from '@/components';
import { useCatalogo } from '@/context';
import { CATEGORIAS_DISENO } from '@/data/disenos';
import { ClientaStackParams, ClientaTabsParams } from '@/navigation/tipos';
import { colors } from '@/theme/tokens';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientaTabsParams, 'Disenos'>,
  NativeStackScreenProps<ClientaStackParams>
>;

const MARGEN = 20;
const SEPARACION = 12;
const FAVORITOS = '♥ Favoritos';

/** Figma: Gallery Grid Screen. Reemplaza el envío de fotos de referencia por mensajería. */
export function GaleriaScreen({ navigation }: Props) {
  const { disenos, cargando, error, recargar, favoritos, alternarFavorito } = useCatalogo();
  const { width } = useWindowDimensions();
  const [categoria, setCategoria] = useState('Todos');
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const ancho = (Math.min(width, 520) - MARGEN * 2 - SEPARACION) / 2;

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return disenos.filter((d) => {
      if (categoria === FAVORITOS && !favoritos.includes(d.id)) return false;
      if (categoria !== 'Todos' && categoria !== FAVORITOS && d.categoria !== categoria) return false;
      return !texto || d.nombre.toLowerCase().includes(texto);
    });
  }, [disenos, categoria, busqueda, favoritos]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.margen}>
        <Encabezado
          titulo="Diseños"
          onVolver={() => navigation.navigate('Inicio')}
          derecha={
            <BotonIcono
              icono={buscando ? 'x' : 'search'}
              etiqueta={buscando ? 'Cerrar búsqueda' : 'Buscar diseño'}
              onPress={() => {
                setBuscando((v) => !v);
                setBusqueda('');
              }}
            />
          }
        />
        {buscando && (
          <View style={styles.busqueda}>
            <CampoTexto
              icono="search"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
            />
          </View>
        )}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[...CATEGORIAS_DISENO, FAVORITOS].map((c) => (
            <Chip key={c} texto={c} activo={categoria === c} onPress={() => setCategoria(c)} />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : cargando ? (
        <EstadoCargando texto="Cargando diseños…" />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(d) => d.id}
          numColumns={2}
          columnWrapperStyle={styles.columna}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <EstadoVacio
              titulo={categoria === FAVORITOS ? 'Todavía no tenés favoritos' : 'Sin diseños en esta categoría'}
              mensaje={
                categoria === FAVORITOS
                  ? 'Tocá el corazón de un diseño para guardarlo aquí.'
                  : 'Pronto vamos a publicar trabajos nuevos. Mirá las otras categorías.'
              }
            />
          }
          renderItem={({ item }) => (
            <TarjetaDiseno
              diseno={item}
              ancho={ancho}
              favorito={favoritos.includes(item.id)}
              onFavorito={() => alternarFavorito(item.id)}
              onPress={() => navigation.navigate('DisenoDetalle', { disenoId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  margen: { paddingHorizontal: MARGEN },
  busqueda: { marginBottom: 12 },
  chips: { paddingHorizontal: MARGEN, gap: 8, paddingBottom: 16 },
  grid: { paddingHorizontal: MARGEN, paddingBottom: 24, gap: 18 },
  columna: { gap: SEPARACION },
});

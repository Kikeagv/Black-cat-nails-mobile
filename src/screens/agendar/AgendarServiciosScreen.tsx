import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BarraInferior,
  Boton,
  Encabezado,
  EstadoCargando,
  FilaServicioSeleccionable,
  IndicadorPasos,
  Pantalla,
} from '@/components';
import { useAgenda, useCatalogo } from '@/context';
import { formatoDuracion, formatoMonto, resumirSeleccion } from '@/domain';
import { ClientaStackParams } from '@/navigation/tipos';
import { colors, fonts } from '@/theme/tokens';

type Props = NativeStackScreenProps<ClientaStackParams, 'AgendarServicios'>;

/** Figma: screen-4a-servicios. Recalcula duración y monto con cada selección. */
export function AgendarServiciosScreen({ navigation, route }: Props) {
  const { servicios, cargando } = useCatalogo();
  const { borrador, actualizarBorrador, reiniciarBorrador } = useAgenda();

  // Cada vez que se entra al flujo se empieza un borrador nuevo (con el servicio preseleccionado, si viene).
  useEffect(() => {
    reiniciarBorrador(route.params?.servicioIds ?? []);
  }, [route.params?.servicioIds, reiniciarBorrador]);

  const seleccion = useMemo(
    () => servicios.filter((s) => borrador.servicioIds.includes(s.id)),
    [servicios, borrador.servicioIds]
  );
  const resumen = resumirSeleccion(seleccion);

  const alternar = (id: string) => {
    const ids = borrador.servicioIds.includes(id)
      ? borrador.servicioIds.filter((x) => x !== id)
      : [...borrador.servicioIds, id];
    // Cambiar servicios cambia la duración, así que el horario elegido deja de ser válido.
    actualizarBorrador({ servicioIds: ids, hora: null });
  };

  return (
    <Pantalla
      footer={
        <BarraInferior
          etiqueta="TOTAL SELECCIONADO"
          valor={seleccion.length ? formatoDuracion(resumen.duracionServiciosMin) : 'Sin servicios'}
          destacado={seleccion.length ? formatoMonto(resumen.montoTotal) : undefined}
          accion={
            <Boton
              titulo="Continuar"
              iconoDerecha="arrow-right"
              compacto
              deshabilitado={!seleccion.length}
              onPress={() => navigation.navigate('AgendarFecha')}
              style={styles.boton}
            />
          }
        />
      }
    >
      <Encabezado titulo="Elegí tus servicios" onVolver={() => navigation.goBack()} />
      <IndicadorPasos actual={1} />
      {cargando ? (
        <EstadoCargando />
      ) : (
        <View style={styles.lista}>
          {servicios.map((s) => (
            <FilaServicioSeleccionable
              key={s.id}
              servicio={s}
              seleccionado={borrador.servicioIds.includes(s.id)}
              onToggle={() => alternar(s.id)}
            />
          ))}
        </View>
      )}
      <Text style={styles.nota}>
        Podés combinar servicios. Al tiempo total se suman 15 minutos de preparación entre citas.
      </Text>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 10 },
  nota: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSubtle, marginTop: 16, textAlign: 'center' },
  boton: { height: 44, paddingHorizontal: 18 },
});

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { Boton } from './Boton';

/** Gato con destello del estado vacío de "Mis citas" (Figma m5-mis-citas-empty). */
function IconoGato() {
  return (
    <View style={styles.circulo}>
      <MaterialCommunityIcons name="cat" size={52} color={colors.white} />
      <Feather name="star" size={16} color={colors.petalPink} style={styles.destello} />
    </View>
  );
}

export function EstadoVacio({
  titulo,
  mensaje,
  accion,
  onAccion,
}: {
  titulo: string;
  mensaje: string;
  accion?: string;
  onAccion?: () => void;
}) {
  return (
    <View style={styles.centro}>
      <IconoGato />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      {accion && onAccion && <Boton titulo={accion} icono="plus" onPress={onAccion} style={styles.boton} />}
    </View>
  );
}

export function EstadoCargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator color={colors.petalPink} size="large" />
      <Text style={styles.mensaje}>{texto}</Text>
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <View style={styles.centro}>
      <Feather name="wifi-off" size={36} color={colors.error} />
      <Text style={styles.titulo}>No pudimos cargar la información</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      <Boton titulo="Reintentar" icono="refresh-cw" variante="contorno" onPress={onReintentar} style={styles.boton} />
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 16, gap: 10 },
  circulo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(181,68,110,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  destello: { position: 'absolute', top: 14, right: 18 },
  titulo: { fontFamily: fonts.bold, fontSize: 18, color: colors.white, textAlign: 'center' },
  mensaje: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  boton: { alignSelf: 'stretch', marginTop: 12 },
});

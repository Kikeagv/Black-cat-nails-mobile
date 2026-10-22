import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/theme/tokens';

/** Barra fija inferior del agendamiento: resumen a la izquierda y acción a la derecha. */
export function BarraInferior({
  etiqueta,
  valor,
  destacado,
  accion,
}: {
  etiqueta?: string;
  valor?: string;
  destacado?: string;
  accion: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {etiqueta ? (
        <View style={styles.resumen}>
          <Text style={styles.etiqueta}>{etiqueta}</Text>
          <Text style={styles.valor}>
            {valor}
            {destacado ? <Text style={styles.destacado}> · {destacado}</Text> : null}
          </Text>
        </View>
      ) : null}
      <View style={etiqueta ? undefined : styles.completo}>{accion}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.dark,
    gap: 12,
  },
  resumen: { flex: 1 },
  completo: { flex: 1 },
  etiqueta: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted, letterSpacing: 0.5 },
  valor: { fontFamily: fonts.bold, fontSize: 14, color: colors.white, marginTop: 2 },
  destacado: { color: colors.petalPink },
});

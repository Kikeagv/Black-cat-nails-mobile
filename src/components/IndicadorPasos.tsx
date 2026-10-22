import { StyleSheet, View } from 'react-native';
import { Chip } from './Chip';

/** "Paso 1 · Paso 2 · Paso 3" del flujo de agendamiento. */
export function IndicadorPasos({ actual, total = 3 }: { actual: number; total?: number }) {
  return (
    <View style={styles.fila} accessibilityLabel={`Paso ${actual} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Chip key={i} texto={`Paso ${i + 1}`} activo={i + 1 === actual} pequeno />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 6, marginBottom: 16 },
});

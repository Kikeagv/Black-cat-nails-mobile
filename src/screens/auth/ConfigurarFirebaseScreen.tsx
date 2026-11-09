import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components';
import { colors, fonts, radius } from '@/theme/tokens';

/** Se muestra solo si falta el archivo .env: explica cómo conectar el proyecto de Firebase. */
export function ConfigurarFirebaseScreen() {
  const pasos = [
    'Copiá .env.example como .env en la raíz del proyecto.',
    'Pegá los valores de firebaseConfig de tu app web de Firebase.',
    'Reiniciá Expo con npx expo start -c para que lea las variables.',
  ];
  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Logo size={72} />
        <Text style={styles.titulo}>Falta conectar Firebase</Text>
        <Text style={styles.texto}>La app no encontró las variables EXPO_PUBLIC_FIREBASE_* del archivo .env.</Text>
        <View style={styles.tarjeta}>
          {pasos.map((p, i) => (
            <Text key={p} style={styles.paso}>
              {i + 1}. {p}
            </Text>
          ))}
        </View>
        <Text style={styles.texto}>Para probar sin internet: npm run emuladores y EXPO_PUBLIC_USAR_EMULADORES=1.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.dark },
  contenido: { padding: 28, gap: 16, alignItems: 'center' },
  titulo: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
  texto: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 10, alignSelf: 'stretch' },
  paso: { fontFamily: fonts.regular, fontSize: 14, color: colors.white, lineHeight: 20 },
});

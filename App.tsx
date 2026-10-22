/**
 * BLACK CAT NAILS — APLICACIÓN MÓVIL (Etapa 3, Avance 1)
 *
 * Punto de entrada: carga las fuentes del sistema de diseño y monta los
 * providers en orden de dependencia (Auth → Catálogo → Agenda).
 */

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AgendaProvider, AuthProvider, CatalogoProvider } from '@/context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme/tokens';

export default function App() {
  const [fuentesListas] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fuentesListas) return <View style={{ flex: 1, backgroundColor: colors.dark }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CatalogoProvider>
          <AgendaProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AgendaProvider>
        </CatalogoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

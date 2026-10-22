import { Alert, Platform } from 'react-native';

/**
 * Diálogos que funcionan igual en Android, iOS y web.
 * `Alert.alert` con botones no hace nada en react-native-web, así que en web
 * se usan los diálogos nativos del navegador.
 */

export function avisar(titulo: string, mensaje: string, alCerrar?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
    alCerrar?.();
    return;
  }
  Alert.alert(titulo, mensaje, [{ text: 'Entendido', onPress: alCerrar }]);
}

export function confirmar(
  titulo: string,
  mensaje: string,
  { aceptar = 'Aceptar', cancelar = 'Cancelar', destructivo = false } = {}
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: cancelar, style: 'cancel', onPress: () => resolve(false) },
      { text: aceptar, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

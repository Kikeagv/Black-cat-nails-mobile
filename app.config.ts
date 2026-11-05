/**
 * Configuración dinámica de Expo. Parte de app.json y agrega el plugin de
 * Google Sign-In solo cuando el .env trae el esquema de URL de iOS
 * (REVERSED_CLIENT_ID), que el SDK nativo de Google necesita para volver a la
 * app después de elegir la cuenta. Expo lee el .env antes de evaluar este archivo.
 */

import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const esquemaGoogle = process.env.GOOGLE_IOS_URL_SCHEME;
  const plugins: ExpoConfig['plugins'] = [...(config.plugins ?? [])];
  if (esquemaGoogle) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: esquemaGoogle }]);
  }
  return { ...config, name: config.name ?? 'Black Cat Nails', slug: config.slug ?? 'black-cat-nails-mobile', plugins };
};

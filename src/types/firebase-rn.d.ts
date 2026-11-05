/**
 * El paquete `firebase/auth` publica getReactNativePersistence solo en su build
 * para React Native (condición "react-native" que usa Metro), pero sus tipos
 * por defecto son los de web. Esta declaración lo hace visible para TypeScript.
 */
import 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}

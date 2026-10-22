import { Image, StyleSheet } from 'react-native';

/** Logotipo del gato negro, exportado del prototipo de Figma. */
export function Logo({ size = 150 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={[styles.logo, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="Logotipo de Black Cat Nails"
    />
  );
}

const styles = StyleSheet.create({
  logo: { resizeMode: 'contain' },
});

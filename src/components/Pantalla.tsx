import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}

/** Contenedor base de cada pantalla: fondo de marca, márgenes seguros y scroll opcional. */
export function Pantalla({ children, scroll = true, edges = ['top'], contentStyle, footer }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.contenido, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.contenido, styles.flex, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  flex: { flex: 1 },
  contenido: { paddingHorizontal: spacing.lg - 4, paddingBottom: spacing.xl },
});

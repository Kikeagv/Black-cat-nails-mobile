import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MESES_CORTOS, partesNegocio } from '@/domain';
import { colors, fonts, radius } from '@/theme/tokens';
import { Cita } from '@/types';
import { BadgeEstado } from './BadgeEstado';

/** Tarjeta de cita de "Mis citas": bloque de fecha, servicio, hora, estado y acciones. */
export function TarjetaCita({ cita, acciones, subtitulo }: { cita: Cita; acciones?: ReactNode; subtitulo?: string }) {
  const p = partesNegocio(cita.inicio);
  const titulo = cita.servicios.map((s) => s.nombre).join(' + ');

  return (
    <View style={styles.tarjeta}>
      <View style={styles.fila}>
        <View style={styles.fecha}>
          <Text style={styles.dia}>{p.dia}</Text>
          <Text style={styles.mes}>{MESES_CORTOS[p.mes].toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          <Text style={styles.hora}>{subtitulo ?? `${p.hora} hs`}</Text>
        </View>
        <BadgeEstado estado={cita.estado} />
      </View>
      {acciones ? <View style={styles.acciones}>{acciones}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fecha: { width: 40, alignItems: 'center' },
  dia: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  mes: { fontFamily: fonts.semibold, fontSize: 10, color: colors.petalPink },
  flex: { flex: 1 },
  titulo: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  hora: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  acciones: { flexDirection: 'row', gap: 10 },
});

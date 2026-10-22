import { Feather } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Boton, CampoTexto, Encabezado, Pantalla } from '@/components';
import { useAuth } from '@/context';
import { contarReferidas, DESCUENTO_REFERIDO } from '@/domain';
import { ClientaStackParams, ClientaTabsParams } from '@/navigation/tipos';
import { perfilSchema } from '@/schemas/perfil';
import { authService, mensajeDeError } from '@/services';
import { colors, fonts, radius } from '@/theme/tokens';
import { Usuaria } from '@/types';
import { avisar, confirmar } from '@/utils/dialogos';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClientaTabsParams, 'Perfil'>,
  NativeStackScreenProps<ClientaStackParams>
>;

type CampoEditable = 'correo' | 'telefono';

/** Figma: m6-perfil-referidos. Datos de contacto editables y módulo de referidos. */
export function PerfilScreen({ navigation }: Props) {
  const { usuaria, actualizarPerfil, logout } = useAuth();
  const [editando, setEditando] = useState<CampoEditable | null>(null);
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [referidas, setReferidas] = useState<Usuaria[]>([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!usuaria) return;
    authService.listarUsuarias().then((todas) => setReferidas(todas.filter((u) => u.referidaPor === usuaria.codigoReferido)));
  }, [usuaria]);

  if (!usuaria) return null;
  const totalReferidas = contarReferidas(usuaria, [...referidas]);

  const empezarEdicion = (campo: CampoEditable) => {
    setEditando(campo);
    setValor(usuaria[campo]);
    setError(undefined);
  };

  const guardar = async () => {
    if (!editando) return;
    const res = perfilSchema.shape[editando].safeParse(valor);
    if (!res.success) return setError(res.error.issues[0].message);
    setGuardando(true);
    try {
      await actualizarPerfil({ [editando]: res.data });
      setEditando(null);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      avisar('Permiso necesario', 'Habilitá el acceso a tus fotos para cambiar tu foto de perfil.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!res.canceled) await actualizarPerfil({ fotoUri: res.assets[0].uri });
  };

  const copiar = async () => {
    await Clipboard.setStringAsync(usuaria.codigoReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = () =>
    Share.share({
      message: `¡Te invito a Black Cat Nails! Registrate con mi código ${usuaria.codigoReferido} y las dos tenemos ${
        DESCUENTO_REFERIDO * 100
      }% de descuento en el próximo servicio.`,
    });

  const cerrarSesion = async () => {
    const ok = await confirmar('Cerrar sesión', '¿Querés salir de tu cuenta en este dispositivo?', {
      aceptar: 'Cerrar sesión',
      destructivo: true,
    });
    if (ok) await logout();
  };

  const iniciales = usuaria.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const campos: { campo: CampoEditable; etiqueta: string; icono: keyof typeof Feather.glyphMap }[] = [
    { campo: 'correo', etiqueta: 'EMAIL', icono: 'mail' },
    { campo: 'telefono', etiqueta: 'TELÉFONO', icono: 'phone' },
  ];

  return (
    <Pantalla>
      <Encabezado titulo="Mi Perfil" centrado onVolver={() => navigation.navigate('Inicio')} />

      <View style={styles.avatarZona}>
        <Pressable onPress={cambiarFoto} accessibilityLabel="Cambiar foto de perfil">
          {usuaria.fotoUri ? (
            <Image source={{ uri: usuaria.fotoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarVacio]}>
              <Text style={styles.iniciales}>{iniciales}</Text>
            </View>
          )}
          <View style={styles.camara}>
            <Feather name="camera" size={14} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.nombre}>{usuaria.nombre}</Text>
      </View>

      <View style={styles.campos}>
        {campos.map(({ campo, etiqueta, icono }) =>
          editando === campo ? (
            <View key={campo} style={styles.editor}>
              <CampoTexto
                etiqueta={etiqueta}
                icono={icono}
                value={valor}
                onChangeText={(t) => setValor(campo === 'telefono' ? t.replace(/\D/g, '') : t)}
                keyboardType={campo === 'telefono' ? 'number-pad' : 'email-address'}
                autoCapitalize="none"
                maxLength={campo === 'telefono' ? 8 : 80}
                error={error}
                autoFocus
              />
              <View style={styles.editorAcciones}>
                <Boton titulo="Cancelar" variante="contorno" compacto style={styles.flex} onPress={() => setEditando(null)} />
                <Boton titulo="Guardar" compacto style={styles.flex} cargando={guardando} onPress={guardar} />
              </View>
            </View>
          ) : (
            <View key={campo} style={styles.campo}>
              <Feather name={icono} size={18} color={colors.wisteriaBlue} />
              <View style={styles.flex}>
                <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
                <Text style={styles.campoValor}>
                  {campo === 'telefono' ? `+503 ${usuaria.telefono.slice(0, 4)} ${usuaria.telefono.slice(4)}` : usuaria.correo}
                </Text>
              </View>
              <Pressable onPress={() => empezarEdicion(campo)} hitSlop={10} accessibilityLabel={`Editar ${etiqueta.toLowerCase()}`}>
                <Feather name="edit-2" size={16} color={colors.petalPink} />
              </Pressable>
            </View>
          )
        )}
      </View>

      <View style={styles.invita}>
        <Text style={styles.invitaTitulo}>Invita a tus amigas</Text>
        <Text style={styles.invitaTexto}>
          Comparte tu código y ambas recibirán un {DESCUENTO_REFERIDO * 100}% de descuento en su próximo servicio.
        </Text>
        <View style={styles.codigo}>
          <Text style={styles.codigoTexto}>{usuaria.codigoReferido}</Text>
          <Pressable onPress={copiar} style={styles.copiar} accessibilityLabel="Copiar código">
            <Feather name={copiado ? 'check' : 'copy'} size={14} color={colors.berryCrush} />
            <Text style={styles.copiarTexto}>{copiado ? 'Copiado' : 'Copiar'}</Text>
          </Pressable>
        </View>
        <Boton titulo="Compartir código" icono="share-2" onPress={compartir} />
        <View style={styles.separador} />
        <View style={styles.referidasFila}>
          <View style={styles.corazon}>
            <Feather name="heart" size={12} color={colors.berryCrush} />
          </View>
          <Text style={styles.referidasTexto}>
            {totalReferidas} {totalReferidas === 1 ? 'amiga referida' : 'amigas referidas'}
          </Text>
          <Pressable
            onPress={() =>
              avisar(
                'Tus referidas',
                referidas.length ? referidas.map((r) => `• ${r.nombre}`).join('\n') : 'Todavía nadie usó tu código.'
              )
            }
            hitSlop={8}
          >
            <Text style={styles.verLista}>Ver lista</Text>
          </Pressable>
        </View>
      </View>

      <Boton titulo="Cerrar sesión" icono="log-out" variante="contorno" onPress={cerrarSesion} style={styles.salir} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  avatarZona: { alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarVacio: { backgroundColor: colors.berryCrush, alignItems: 'center', justifyContent: 'center' },
  iniciales: { fontFamily: fonts.display, fontSize: 30, color: colors.white },
  camara: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.berryCrush,
    borderWidth: 2,
    borderColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  campos: { gap: 10 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  campoEtiqueta: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted, letterSpacing: 0.5 },
  campoValor: { fontFamily: fonts.regular, fontSize: 15, color: colors.white, marginTop: 2 },
  editor: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 10 },
  editorAcciones: { flexDirection: 'row', gap: 10 },
  invita: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  invitaTitulo: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  invitaTexto: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: -6 },
  codigo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.berryCrush,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: 'rgba(181,68,110,0.08)',
  },
  codigoTexto: { fontFamily: fonts.bold, fontSize: 18, color: colors.berryCrush, letterSpacing: 1 },
  copiar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copiarTexto: { fontFamily: fonts.medium, fontSize: 13, color: colors.berryCrush },
  separador: { height: 1, backgroundColor: colors.border },
  referidasFila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  corazon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  referidasTexto: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.white },
  verLista: { fontFamily: fonts.medium, fontSize: 13, color: colors.petalPink, textDecorationLine: 'underline' },
  salir: { marginTop: 20 },
});

/**
 * NAVEGACIÓN RAÍZ
 *
 * Decide qué árbol de pantallas existe según la sesión y el rol:
 * - Sin sesión: Login y Registro.
 * - Clienta: pestañas (Inicio, Diseños, Mis citas, Perfil) + detalle y flujo de agendamiento.
 * - Administradora: pestañas Agenda y Mi cuenta.
 *
 * Como cada árbol solo se monta para su rol, una clienta no tiene forma de
 * navegar a una pantalla de administración (rutas protegidas por rol).
 */

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EstadoCargando } from '@/components';
import { useAuth } from '@/context';
import { AgendaAdminScreen, PerfilAdminScreen } from '@/screens/admin/AgendaAdminScreen';
import { AgendarConfirmacionScreen } from '@/screens/agendar/AgendarConfirmacionScreen';
import { AgendarExitoScreen } from '@/screens/agendar/AgendarExitoScreen';
import { AgendarFechaScreen } from '@/screens/agendar/AgendarFechaScreen';
import { AgendarServiciosScreen } from '@/screens/agendar/AgendarServiciosScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegistroScreen } from '@/screens/auth/RegistroScreen';
import { DisenoDetalleScreen } from '@/screens/clienta/DisenoDetalleScreen';
import { GaleriaScreen } from '@/screens/clienta/GaleriaScreen';
import { InicioScreen } from '@/screens/clienta/InicioScreen';
import { MisCitasScreen } from '@/screens/clienta/MisCitasScreen';
import { PerfilScreen } from '@/screens/clienta/PerfilScreen';
import { colors, fonts } from '@/theme/tokens';
import { AdminTabsParams, AuthStackParams, ClientaStackParams, ClientaTabsParams } from './tipos';
import { View } from 'react-native';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const ClientaStack = createNativeStackNavigator<ClientaStackParams>();
const ClientaTabs = createBottomTabNavigator<ClientaTabsParams>();
const AdminTabs = createBottomTabNavigator<AdminTabsParams>();

const tema: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.petalPink,
    background: colors.dark,
    card: colors.dark,
    text: colors.white,
    border: colors.border,
  },
};

const opcionesTabs = {
  headerShown: false,
  tabBarActiveTintColor: colors.petalPink,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: { backgroundColor: '#15100A', borderTopColor: colors.border, height: 64, paddingTop: 6 },
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
} as const;

function PestanasClienta() {
  return (
    <ClientaTabs.Navigator screenOptions={opcionesTabs}>
      <ClientaTabs.Screen
        name="Inicio"
        component={InicioScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }}
      />
      <ClientaTabs.Screen
        name="Disenos"
        component={GaleriaScreen}
        options={{
          title: 'Diseños',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brush-outline" size={22} color={color} />,
        }}
      />
      <ClientaTabs.Screen
        name="MisCitas"
        component={MisCitasScreen}
        options={{ title: 'Mis citas', tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} /> }}
      />
      <ClientaTabs.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }}
      />
    </ClientaTabs.Navigator>
  );
}

function NavegacionClienta() {
  return (
    <ClientaStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.dark } }}>
      <ClientaStack.Screen name="Tabs" component={PestanasClienta} />
      <ClientaStack.Screen
        name="DisenoDetalle"
        component={DisenoDetalleScreen}
        options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <ClientaStack.Screen name="AgendarServicios" component={AgendarServiciosScreen} />
      <ClientaStack.Screen name="AgendarFecha" component={AgendarFechaScreen} />
      <ClientaStack.Screen name="AgendarConfirmacion" component={AgendarConfirmacionScreen} />
      <ClientaStack.Screen name="AgendarExito" component={AgendarExitoScreen} options={{ gestureEnabled: false }} />
    </ClientaStack.Navigator>
  );
}

function NavegacionAdmin() {
  return (
    <AdminTabs.Navigator screenOptions={opcionesTabs}>
      <AdminTabs.Screen
        name="Agenda"
        component={AgendaAdminScreen}
        options={{ tabBarIcon: ({ color }) => <Feather name="calendar" size={22} color={color} /> }}
      />
      <AdminTabs.Screen
        name="PerfilAdmin"
        component={PerfilAdminScreen}
        options={{ title: 'Mi cuenta', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }}
      />
    </AdminTabs.Navigator>
  );
}

function NavegacionAuth() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.dark } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Registro" component={RegistroScreen} />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const { usuaria, restaurando } = useAuth();

  if (restaurando) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, justifyContent: 'center' }}>
        <EstadoCargando texto="Abriendo Black Cat Nails…" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>
      {!usuaria ? <NavegacionAuth /> : usuaria.rol === 'admin' ? <NavegacionAdmin /> : <NavegacionClienta />}
    </NavigationContainer>
  );
}

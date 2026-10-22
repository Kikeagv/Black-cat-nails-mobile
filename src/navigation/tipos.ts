import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParams = {
  Login: undefined;
  Registro: undefined;
};

export type ClientaTabsParams = {
  Inicio: undefined;
  Disenos: undefined;
  MisCitas: undefined;
  Perfil: undefined;
};

export type ClientaStackParams = {
  Tabs: NavigatorScreenParams<ClientaTabsParams>;
  DisenoDetalle: { disenoId: string };
  AgendarServicios: { servicioIds?: string[] } | undefined;
  AgendarFecha: undefined;
  AgendarConfirmacion: undefined;
  AgendarExito: { citaId: string };
};

export type AdminTabsParams = {
  Agenda: undefined;
  PerfilAdmin: undefined;
};

/**
 * BASE DE DATOS LOCAL — API SIMULADA DE LA ETAPA 3, FORO 1
 *
 * Persiste las colecciones en AsyncStorage para que los datos sobrevivan
 * al cierre de la app. Solo la usan los módulos de `services/`; en el Foro 2
 * esos módulos pasan a leer y escribir en Cloud Firestore y este archivo se elimina.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Cita, Insumo, Servicio, UsuariaConHash } from '@/types';
import { crearSeed, PASSWORD_DEMO } from './seed';

const CLAVE_DB = 'bcn:db:v1';

export interface Db {
  usuarias: UsuariaConHash[];
  servicios: Servicio[];
  insumos: Insumo[];
  citas: Cita[];
}

let cache: Db | null = null;

/** SHA-256 del correo normalizado + contraseña. Firebase Auth lo reemplaza en el Foro 2. */
export async function hashPassword(correo: string, password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${correo.trim().toLowerCase()}:${password}`
  );
}

async function crearDbInicial(): Promise<Db> {
  const seed = crearSeed();
  const usuarias = await Promise.all(
    seed.usuarias.map(async (u) => ({
      ...u,
      passwordHash: await hashPassword(u.correo, PASSWORD_DEMO),
    }))
  );
  return { ...seed, usuarias };
}

export async function leerDb(): Promise<Db> {
  if (cache) return cache;
  const guardada = await AsyncStorage.getItem(CLAVE_DB);
  if (guardada) {
    cache = JSON.parse(guardada) as Db;
  } else {
    cache = await crearDbInicial();
    await AsyncStorage.setItem(CLAVE_DB, JSON.stringify(cache));
  }
  return cache;
}

/** Aplica un cambio sobre la base y lo guarda. */
export async function escribirDb(mutar: (db: Db) => void): Promise<Db> {
  const db = await leerDb();
  mutar(db);
  await AsyncStorage.setItem(CLAVE_DB, JSON.stringify(db));
  return db;
}

/** Restaura los datos de demostración (útil antes de grabar el video). */
export async function reiniciarDb(): Promise<void> {
  cache = await crearDbInicial();
  await AsyncStorage.setItem(CLAVE_DB, JSON.stringify(cache));
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Simula la latencia de red para que los estados de carga sean visibles. */
export function latencia(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

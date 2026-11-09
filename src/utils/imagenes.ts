/**
 * Reduce una imagen elegida con expo-image-picker y la devuelve como data URI
 * (JPEG en base64) lista para guardarse dentro de un documento de Firestore.
 *
 * Decisión del Foro 2: Cloud Storage exige el plan Blaze (de pago) en proyectos
 * nuevos, así que las imágenes se guardan reducidas en Firestore. Con 320 px y
 * calidad 0.6 una foto pesa ~25-40 KB, muy por debajo del límite de 1 MiB por
 * documento, y se ve igual en todos los dispositivos de la clienta.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function comprimirImagen(uri: string, anchoMax = 320, calidad = 0.6): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri).resize({ width: anchoMax });
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({ base64: true, compress: calidad, format: SaveFormat.JPEG });
  if (!resultado.base64) throw new Error('No se pudo procesar la imagen');
  return `data:image/jpeg;base64,${resultado.base64}`;
}

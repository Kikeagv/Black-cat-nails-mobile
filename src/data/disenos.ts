import { Diseno } from '@/types';

/**
 * Galería de diseños publicada por la propietaria.
 * En el Foro 2 esta colección pasa a Firestore y las imágenes a un hosting
 * gratuito; por ahora viven como assets locales tomados del prototipo de Figma.
 */
export const DISENOS: Diseno[] = [
  {
    id: 'dis_1',
    nombre: 'Rosas en relieve',
    categoria: 'Nail art',
    precioDesde: 35,
    servicioSugeridoId: 'srv_4',
    descripcion:
      'Delicado diseño artesanal que combina una base brillante negro profundo con rosas tridimensionales esculpidas a mano en tonos rosa pétalo. Incluye sutiles destellos dorados para un acabado glamoroso y único.',
    imagen: require('../../assets/images/disenos/rosas-relieve.jpg'),
    imagenDetalle: require('../../assets/images/disenos/rosas-relieve-hero.jpg'),
  },
  {
    id: 'dis_2',
    nombre: 'Mariposa Holográfica',
    categoria: 'Gel',
    precioDesde: 28,
    servicioSugeridoId: 'srv_2',
    descripcion:
      'Base perlada con alas de mariposa delineadas en violeta y un acabado holográfico que cambia de tono con la luz.',
    imagen: require('../../assets/images/disenos/mariposa-holografica.jpg'),
  },
  {
    id: 'dis_3',
    nombre: 'Gótico Francés',
    categoria: 'Acrílico',
    precioDesde: 32,
    servicioSugeridoId: 'srv_3',
    descripcion:
      'Uñas esculpidas en negro mate con cruces finas en dorado. Un clásico de la casa, fiel al estilo de la marca.',
    imagen: require('../../assets/images/disenos/gotico-frances.jpg'),
  },
  {
    id: 'dis_4',
    nombre: 'Auroras Boreales',
    categoria: 'Gel',
    precioDesde: 25,
    servicioSugeridoId: 'srv_2',
    descripcion:
      'Efecto cromado verde y rosa que imita una aurora boreal. Ideal para quienes quieren brillo sin diseño recargado.',
    imagen: require('../../assets/images/disenos/auroras-boreales.jpg'),
  },
  {
    id: 'dis_5',
    nombre: 'Perlas Midnight',
    categoria: 'Nail art',
    precioDesde: 30,
    servicioSugeridoId: 'srv_4',
    descripcion:
      'Tono vino profundo con una uña de acento cubierta de micro perlas. Elegante para eventos de noche.',
    imagen: require('../../assets/images/disenos/perlas-midnight.jpg'),
  },
  {
    id: 'dis_6',
    nombre: 'Minimal Cats',
    categoria: 'Nail art',
    precioDesde: 22,
    servicioSugeridoId: 'srv_4',
    descripcion:
      'Base nude con gatitos de línea fina pintados a mano. El guiño más tierno a la identidad de Black Cat Nails.',
    imagen: require('../../assets/images/disenos/minimal-cats.jpg'),
  },
];

export const CATEGORIAS_DISENO = ['Todos', 'Acrílico', 'Gel', 'Pedicura', 'Nail art'];

import { ImageSourcePropType } from 'react-native';

export type Guesthouse = {
  id: string;
  name: string;
  location: string;
  distance?: string;
  image: ImageSourcePropType;
  rating: string;
  reviews: number;
  tags: string[];
  room: string;
  price: string;
  description?: string;
  badge?: string;
};

export const nearbyGuesthouses: Guesthouse[] = [
  {
    id: 'mokolodi',
    name: 'Mokolodi Bush Haven',
    location: 'Gaborone',
    distance: '4.2 km away',
    image: require('../../assets/guesthouses/mokolodi.jpeg'),
    rating: '4.8',
    reviews: 62,
    tags: ['Free Wi-Fi', 'Air-Con', 'Plunge Pool'],
    room: 'Standard Suite',
    price: 'P 650',
  },
  {
    id: 'phakalane',
    name: 'Phakalane Sun Chalets',
    location: 'Gaborone',
    distance: '12 km away',
    image: require('../../assets/guesthouses/phakalane.jpeg'),
    rating: '4.6',
    reviews: 41,
    tags: ['Private Gate', 'Breakfast', 'Pool'],
    room: 'Deluxe Chalet',
    price: 'P 580',
  },
];

export const topRatedGuesthouses: Guesthouse[] = [
  {
    id: 'chobe',
    name: 'Chobe River View Manor',
    location: 'Plateau, Kasane',
    image: require('../../assets/guesthouses/chobe.jpeg'),
    rating: '4.95',
    reviews: 84,
    tags: ['Game Drives', 'Boat Cruise', 'River Deck'],
    room: 'River View Suite',
    price: 'P 1,250',
    description:
      'Panoramic vantage over the Chobe floodplains with secluded riverside viewing decks and artisanal safari dining.',
    badge: 'Verified',
  },
  {
    id: 'thamalakane',
    name: 'Thamalakane Waters Edge',
    location: 'Sedie Ward, Maun',
    image: require('../../assets/guesthouses/thamalakane.jpeg'),
    rating: '4.91',
    reviews: 56,
    tags: ['Mokoro Trips', 'Solar Power', 'B&B Included'],
    room: 'Lodge Chalet',
    price: 'P 890',
    description:
      'Gentle waterways shaded by giant camelthorn trees, with a calm riverside setting for an authentic Botswana stay.',
  },
];

export const destinations = [
  { name: 'Maun', detail: 'Okavango Delta', badge: 'Safari Hub', icon: 'compass' as const },
  { name: 'Kasane', detail: 'Riverfront Border', badge: 'Chobe', icon: 'sunny' as const },
  { name: 'Francistown', detail: 'Commercial Capital', badge: 'East Node', icon: 'business' as const },
  { name: 'Palapye', detail: 'Central Waypoint', badge: 'Transit', icon: 'car' as const },
];

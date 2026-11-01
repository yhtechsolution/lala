import { Image } from 'expo-image';
import { makeThemedStyles } from '../theme';
const icons = {
  back: require('../../assets/detail/back.svg'),
  share: require('../../assets/detail/share.svg'),
  heart: require('../../assets/detail/heart.svg'),
  photos: require('../../assets/detail/photos.svg'),
  star: require('../../assets/detail/star.svg'),
  pin: require('../../assets/detail/pin.svg'),
  shield: require('../../assets/detail/shield.svg'),
  wifi: require('../../assets/detail/wifi.svg'),
  ac: require('../../assets/detail/ac.svg'),
  pool: require('../../assets/detail/pool.svg'),
  parking: require('../../assets/detail/parking.svg'),
  breakfast: require('../../assets/detail/breakfast.svg'),
  kitchen: require('../../assets/detail/kitchen.svg'),
  external: require('../../assets/detail/external.svg'),
  contact: require('../../assets/detail/contact.svg'),
};
const styles = makeThemedStyles((colors) => ({
  back: { width: 13.3333, height: 13.3333 },
  share: { width: 15.0, height: 16.6667 },
  heart: { width: 16.6667, height: 15.2917 },
  photos: { width: 12.5, height: 11.25 },
  star: { width: 11.6667, height: 11.0833 },
  pin: { width: 12.0, height: 17.0 },
  shield: { width: 12.0, height: 15.0 },
  wifi: { width: 20.0, height: 14.1667 },
  ac: { width: 16.6667, height: 16.6667 },
  pool: { width: 16.6667, height: 15.0 },
  parking: { width: 10.8333, height: 15.0 },
  breakfast: { width: 15.0, height: 15.0 },
  kitchen: { width: 13.3333, height: 16.6667 },
  external: { width: 13.5, height: 13.5 },
  contact: { width: 16.6667, height: 16.6667 },
}));
export type DetailIconName = keyof typeof icons;
// Original Figma vectors retain their intrinsic dimensions.
export function DetailIcon({ name }: { name: DetailIconName }) {
  return (
    <Image
      source={icons[name]}
      style={styles[name]}
      contentFit="contain"
      accessibilityElementsHidden
    />
  );
}

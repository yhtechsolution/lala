import { Image } from 'expo-image';
import { styles } from '../styles/SearchIcon.styles';

const icons = {
  ratingStarMuted: require('../../assets/search/ratingStarMuted.svg'),
  clear: require('../../assets/search/clear.svg'),
  show: require('../../assets/search/show.svg'),
  headerFilter: require('../../assets/search/headerFilter.svg'),
  back: require('../../assets/search/back.svg'),
  search: require('../../assets/search/search.svg'),
  filter: require('../../assets/search/filter.svg'),
  close: require('../../assets/search/close.svg'),
  check: require('../../assets/search/check.svg'),
  star: require('../../assets/search/star.svg'),
  ratingStar: require('../../assets/search/ratingStar.svg'),
};
export function SearchIcon({ name }: { name: keyof typeof icons }) {
  return (
    <Image
      source={icons[name]}
      style={styles[name]}
      contentFit="contain"
      accessibilityElementsHidden
    />
  );
}

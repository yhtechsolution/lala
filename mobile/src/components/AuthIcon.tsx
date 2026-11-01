import { Image } from 'expo-image';

// Original Figma assets, rendered at their intrinsic dimensions.
const icons = {
  help: [require('../../assets/auth/c790a.svg'), 15, 15],
  signIn: [require('../../assets/auth/933e9.svg'), 12.75, 12.75],
  createAccount: [require('../../assets/auth/7f2bb.svg'), 15.5833, 11.3333],
  welcome: [require('../../assets/auth/7f190.svg'), 20.1667, 16.5],
  email: [require('../../assets/auth/69d59.svg'), 25.8333, 12.6667],
  password: [require('../../assets/auth/140a8.svg'), 12.6667, 16.625],
  arrow: [require('../../assets/auth/03d99.svg'), 12, 12],
  shield: [require('../../assets/auth/8183f.svg'), 13.3333, 16.6667],
  notice: [require('../../assets/auth/c37f7.svg'), 14.1667, 14.1667],
  close: [require('../../assets/auth/89bf7.svg'), 11.6667, 11.6667],
  send: [require('../../assets/auth/58f10.svg'), 13.4583, 11.3333],
  filter: [require('../../assets/auth/009a2.svg'), 15, 15],
  profile: [require('../../assets/auth/b3f27.svg'), 12, 12],
  homeTab: [require('../../assets/auth/218a4.svg'), 14.6667, 16.5],
  exploreTab: [require('../../assets/auth/4b6c1.svg'), 18.3333, 18.3333],
  favouritesTab: [require('../../assets/auth/4d54f.svg'), 18.3333, 16.8208],
  profileTab: [require('../../assets/auth/c6c2e.svg'), 14.6667, 14.6667],
} as const;
export type AuthIconName = keyof typeof icons;
export function AuthIcon({ name }: { name: AuthIconName }) {
  const [source, width, height] = icons[name];
  return (
    <Image
      source={source}
      style={{ width, height }}
      contentFit="contain"
      accessibilityElementsHidden
    />
  );
}

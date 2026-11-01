import { StyleSheet } from 'react-native';

export type ColorScheme = 'light' | 'dark';

// Light palette: the original app colours, plus a few extra names for colours that used to
// be written directly in the style files.
const light = {
  background: '#F9F9FF',
  surface: '#FFFFFF',
  primary: '#1F6E6C',
  // Strong teal used as a button or badge fill (text on it is white).
  primarySolid: '#1F6E6C',
  primaryDark: '#005553',
  primaryFill: '#005553',
  text: '#161C27',
  textMuted: '#3F4948',
  textSoft: '#6F7978',
  blueSurface: '#E8EEFF',
  blueChip: '#CFE2F9',
  iconSurface: '#E3E8F9',
  quietSurface: '#F1F3FF',
  border: '#E5E9F2',
  white: '#FFFFFF',
  warning: '#A34B00',
  accent: '#7D3700',
  accentSolid: '#7D3700',
  orangeFill: '#A04B08',
  onOrange: '#321200',
  orangeSolid: '#A04B09',
  orangeText: '#A04B09',
  slate: '#4E6073',
  track: '#DDE2F3',
  star: '#B45309',
  starEmpty: '#CCCCCC',
  paper: '#F6FAFF',
  line: '#E6E1D8',
  ink: '#1A202C',
  inkMuted: '#5F676E',
  cream: '#F7F4EC',
  creamDeep: '#EDE7DB',
  tabBar: '#FBF9F5',
} as const;

export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  background: '#0F1419',
  surface: '#1A2028',
  primary: '#4FB8B3',
  primarySolid: '#1F7F7B',
  primaryDark: '#7ED8D3',
  primaryFill: '#1F7F7B',
  text: '#E8EDF5',
  textMuted: '#B8C2CC',
  textSoft: '#8D99A6',
  blueSurface: '#1B2740',
  blueChip: '#23384A',
  iconSurface: '#232B3D',
  quietSurface: '#171E27',
  border: '#2B3440',
  white: '#FFFFFF',
  warning: '#FFB070',
  accent: '#FFB784',
  accentSolid: '#B3560F',
  orangeFill: '#FFB784',
  onOrange: '#321200',
  orangeSolid: '#B3560F',
  orangeText: '#FFB784',
  slate: '#9FB0C3',
  track: '#2E3748',
  star: '#F5A94E',
  starEmpty: '#4A5563',
  paper: '#0F1419',
  line: '#2B3440',
  ink: '#E8EDF5',
  inkMuted: '#9AA6B2',
  cream: '#1E2630',
  creamDeep: '#2B3441',
  tabBar: '#141A22',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

// The scheme in use right now. ThemeProvider sets it before the screens render.
let activeScheme: ColorScheme = 'light';
export const getActiveScheme = () => activeScheme;
export const setActiveScheme = (scheme: ColorScheme) => {
  activeScheme = scheme;
};

// `colors.x` always reads from the palette of the scheme in use, so existing code such as
// <Icon color={colors.primary} /> follows the theme without changes.
export const colors: Palette = new Proxy({} as Palette, {
  get: (_target, key) => palettes[activeScheme][key as keyof Palette],
  has: (_target, key) => key in light,
  ownKeys: () => Reflect.ownKeys(light),
  getOwnPropertyDescriptor: (_target, key) =>
    key in light
      ? {
          configurable: true,
          enumerable: true,
          value: palettes[activeScheme][key as keyof Palette],
        }
      : undefined,
});

// Same colour with a different opacity, e.g. alpha(colors.background, 0.9).
export function alpha(color: string, opacity: number) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!match) return color;
  const [, r, g, b] = match;
  return `rgba(${parseInt(r!, 16)},${parseInt(g!, 16)},${parseInt(b!, 16)},${opacity})`;
}

// Like StyleSheet.create, but the styles are rebuilt for each colour scheme the first time
// they are used. The factory receives the palette to use.
export function makeThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (palette: Palette) => T,
): T {
  const cache = new Map<ColorScheme, T>();
  const current = () => {
    let styles = cache.get(activeScheme);
    if (!styles) {
      styles = StyleSheet.create(factory(palettes[activeScheme]));
      cache.set(activeScheme, styles);
    }
    return styles;
  };
  return new Proxy({} as T, {
    get: (_target, key) => current()[key as keyof T],
    has: (_target, key) => key in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_target, key) =>
      key in current()
        ? {
            configurable: true,
            enumerable: true,
            value: current()[key as keyof T],
          }
        : undefined,
  });
}

export const shadows = {
  card: {
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  soft: {
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
} as const;

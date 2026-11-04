import { StyleSheet } from 'react-native';

export type ColorScheme = 'light' | 'dark';

// Light palette: the "Warm Earth Minimal" colours, plus a few extra names for colours that
// were written directly in style files or that need a different value in dark mode.
const light = {
  background: '#FEF8F4',
  surface: '#FDFBF7',
  // Pure white card background (surface is slightly warm).
  card: '#FFFFFF',
  primary: '#4A3324',
  // Strong brown used as a button or badge fill (text on it is white).
  primarySolid: '#4A3324',
  primaryDark: '#321E10',
  primaryFill: '#321E10',
  accent: '#C47C48',
  // The accent used as a fill behind white text.
  accentSolid: '#C47C48',
  text: '#2C1D14',
  textMuted: '#4F453F',
  textSoft: '#7A6B60',
  blueSurface: '#F5EFEB',
  blueChip: '#EFE9DC',
  iconSurface: '#F3EDE9',
  quietSurface: '#F5EFEB',
  border: '#DFD5C4',
  white: '#FFFFFF',
  warning: '#B35419',
  danger: '#A12323',
  creamDeep: '#EDE7DB',
  warmChip: '#F5E8DB',
  tabBar: '#FBF9F5',
} as const;

export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  background: '#17110D',
  surface: '#211914',
  card: '#211914',
  primary: '#E3B791',
  primarySolid: '#8A5A3C',
  primaryDark: '#F0D2B5',
  primaryFill: '#7A4E32',
  accent: '#E8A06D',
  accentSolid: '#A5632F',
  text: '#F4EAE2',
  textMuted: '#CDBFB4',
  textSoft: '#A8998C',
  blueSurface: '#2A2018',
  blueChip: '#34281E',
  iconSurface: '#2E241B',
  quietSurface: '#251C15',
  border: '#3A2E24',
  white: '#FFFFFF',
  warning: '#FFB27A',
  danger: '#FF9A8F',
  creamDeep: '#33281E',
  warmChip: '#3A2B1E',
  tabBar: '#1C1510',
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
    shadowColor: '#4A3324',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  soft: {
    shadowColor: '#4A3324',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

// Which colour scheme to show. Pure logic so it can be unit-tested.
export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

// Saved text can be missing or damaged; anything unusable means "follow the phone".
export function parseThemeMode(raw: string | null | undefined): ThemeMode {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

// "system" follows the phone's setting; a phone with no setting counts as light.
export function resolveScheme(
  mode: ThemeMode,
  system: string | null | undefined,
): Scheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

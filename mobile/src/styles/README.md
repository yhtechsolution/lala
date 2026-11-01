# Mobile styles

Each screen or component imports its styles from the matching `.styles.ts` file
in this folder. Edit these files to change layout, spacing, typography, borders,
and backgrounds. Shared colours and shadow presets remain in `../theme.ts`.

## Light and dark mode

Styles are written as `makeThemedStyles((colors) => ({ ... }))` instead of
`StyleSheet.create({ ... })`. The `colors` argument is the palette for the scheme in
use, so a style built from it works in both light and dark mode. Never write a colour
like `'#FFFFFF'` in a style or component: add a named colour to both palettes in
`../theme.ts` instead (`npm run test:theme` fails if a hex colour is left in a screen
or style file, or if the dark palette is missing a colour or is too faint to read).
For a colour with transparency use `alpha(colors.background, 0.9)`.

For example, `BrowseScreen.tsx` imports `BrowseScreen.styles.ts`, and `login.tsx`
imports `LoginScreen.styles.ts`.

The mobile app uses React Native's `StyleSheet`, which supports Android, iOS,
and the Expo web preview. Browser CSS files belong to the separate `web` app;
its stylesheet is `web/src/styles.css` at the repository root.

Conditional styles are still selected by components. Values that depend on
runtime data, such as device safe-area insets or an icon's intrinsic dimensions,
also remain with the component. Static style definitions live here.

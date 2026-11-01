# Dark mode (mobile)

**Profile, Appearance** offers three choices: **Phone setting** (default, follows the device), **Light** and **Dark**. The choice is remembered on the device. Changing it rebuilds the screens, so the app returns to Profile afterwards; sign-in and favourites are kept.

## How it works
- `src/theme.ts` holds a light and a dark palette with the same colour names. `colors.x` always returns the colour for the scheme in use, so existing code keeps working.
- Style files use `makeThemedStyles((colors) => ({ ... }))` instead of `StyleSheet.create`. Styles are built once per scheme.
- `ThemeProvider` (`src/context/ThemeContext.tsx`) stores the choice and sets the scheme before any screen renders. `userInterfaceStyle` in `app.json` is `automatic` so Android and iOS report the phone's setting.
- Light mode is visually unchanged: all 304 existing style definitions were compared before and after the change and are identical.

## Adding or changing colours
Never write a hex colour in a screen or style file. Add a named colour to **both** palettes in `theme.ts`. For transparency use `alpha(colors.background, 0.9)`.

## Tests
`npm run test:theme` in `mobile/` checks that the dark palette defines every colour, that text and buttons meet WCAG contrast ratios in dark mode, that every style file builds in both schemes, that no hex colour is left in a screen, and the light/dark/phone-setting logic.

## Not verified
The look of each screen in dark mode has not been checked on a phone. The contrast tests prove the colours are readable, not that every screen looks right. Open each screen once in dark mode before the demo. `src/components/AddReviewModal.tsx` is not used by any screen and was left as it was. After changing `userInterfaceStyle` in `app.json`, rebuild native apps; Expo Go picks it up on restart.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLoader } from './helpers/load-ts.mjs';

const src = fileURLToPath(new URL('../src', import.meta.url));
const load = createLoader();
const theme = load(join(src, 'theme.ts'));
const mode = load(join(src, 'services/themeMode.ts'));
const plain = (value) => JSON.parse(JSON.stringify(value));

// ---------- palettes ----------
const { light, dark } = theme.palettes;
assert.deepEqual(
  Object.keys(dark).sort(),
  Object.keys(light).sort(),
  'dark must define every colour name',
);
for (const [scheme, palette] of Object.entries(theme.palettes))
  for (const [name, value] of Object.entries(palette))
    assert.match(
      value,
      /^#[0-9A-Fa-f]{6}$/,
      `${scheme}.${name} must be a 6-digit hex colour`,
    );
assert.notEqual(dark.background, light.background);
assert.notEqual(dark.text, light.text);

// ---------- contrast (WCAG 2.x) so dark mode is readable without looking at a screen ----------
const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) =>
    channel(parseInt(hex.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mustReadOn = (scheme, foreground, background, minimum) => {
  const p = theme.palettes[scheme];
  const ratio = contrast(p[foreground], p[background]);
  assert.ok(
    ratio >= minimum,
    `${scheme}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
  );
};
// Body text and the colours used for links, chips and buttons, in dark mode.
for (const [fg, bg, min] of [
  ['text', 'background', 7],
  ['text', 'surface', 7],
  ['text', 'quietSurface', 7],
  ['text', 'blueChip', 7],
  ['textMuted', 'surface', 7],
  ['textMuted', 'background', 7],
  ['textSoft', 'surface', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'background', 4.5],
  ['primaryDark', 'blueChip', 4.5],
  ['primaryDark', 'surface', 4.5],
  ['white', 'primarySolid', 4.5],
  ['white', 'primaryFill', 4.5],
  ['onOrange', 'orangeFill', 4.5],
  ['white', 'orangeSolid', 4.5],
  ['white', 'accentSolid', 4.5],
  ['accent', 'surface', 4.5],
  ['orangeText', 'cream', 4.5],
  ['warning', 'surface', 4.5],
  ['slate', 'surface', 4.5],
  ['ink', 'paper', 7],
  ['inkMuted', 'paper', 4.5],
  ['inkMuted', 'cream', 4.5],
  ['ink', 'cream', 7],
  ['star', 'surface', 3],
])
  mustReadOn('dark', fg, bg, min);
// The unchanged light palette keeps its main text readable too.
for (const [fg, bg, min] of [
  ['text', 'background', 7],
  ['text', 'surface', 7],
  ['primary', 'surface', 4.5],
  ['white', 'primarySolid', 4.5],
])
  mustReadOn('light', fg, bg, min);

// ---------- colors proxy ----------
theme.setActiveScheme('light');
assert.equal(theme.colors.background, light.background);
theme.setActiveScheme('dark');
assert.equal(theme.colors.background, dark.background);
assert.deepEqual(Object.keys(theme.colors).sort(), Object.keys(light).sort());
assert.equal({ ...theme.colors }.surface, dark.surface);
assert.equal(theme.getActiveScheme(), 'dark');
theme.setActiveScheme('light');

// ---------- alpha ----------
assert.equal(theme.alpha('#FBF9F5', 0.9), 'rgba(251,249,245,0.9)');
assert.equal(theme.alpha('#005553', 0.1), 'rgba(0,85,83,0.1)');
assert.equal(theme.alpha('rgba(1,2,3,0.5)', 0.1), 'rgba(1,2,3,0.5)');

// ---------- themed styles follow the scheme ----------
let builds = 0;
const demo = theme.makeThemedStyles((c) => {
  builds++;
  return { box: { backgroundColor: c.background }, label: { color: c.text } };
});
theme.setActiveScheme('light');
assert.equal(demo.box.backgroundColor, light.background);
assert.equal(demo.box, demo.box, 'styles are cached per scheme');
theme.setActiveScheme('dark');
assert.equal(demo.box.backgroundColor, dark.background);
assert.equal(demo.label.color, dark.text);
theme.setActiveScheme('light');
assert.equal(demo.box.backgroundColor, light.background);
assert.equal(builds, 2, 'each scheme is built once');
assert.deepEqual(Object.keys(demo), ['box', 'label']);

// ---------- every real style file works in both schemes ----------
const styleFiles = [
  ...readdirSync(join(src, 'styles'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `styles/${f}`),
  'components/ConnectionNotice.tsx',
  'components/PlaceholderScreen.tsx',
  'components/DetailIcon.tsx',
  'components/StarRating.tsx',
];
const colorProps = /color$/i;
let differing = 0;
for (const rel of styleFiles) {
  const exported = load(join(src, rel));
  const sheets = Object.entries(exported).filter(
    ([, v]) => v && typeof v === 'object',
  );
  for (const [name, sheet] of sheets) {
    if (name === 'authColors') continue;
    const snapshots = {};
    for (const scheme of ['light', 'dark']) {
      theme.setActiveScheme(scheme);
      snapshots[scheme] = plain({ ...sheet });
      for (const [styleName, style] of Object.entries(snapshots[scheme]))
        for (const [prop, value] of Object.entries(style))
          if (colorProps.test(prop)) {
            assert.equal(
              typeof value,
              'string',
              `${rel} ${name}.${styleName}.${prop} must be a colour string in ${scheme}`,
            );
            assert.ok(
              value && !value.includes('undefined') && !value.includes('NaN'),
              `${rel} ${name}.${styleName}.${prop} = ${value} in ${scheme}`,
            );
          }
    }
    if (JSON.stringify(snapshots.light) !== JSON.stringify(snapshots.dark))
      differing++;
  }
}
theme.setActiveScheme('light');
assert.ok(
  differing >= 12,
  `most style files should change in dark mode, only ${differing} did`,
);

// The login screen's shared colours follow the scheme too.
const login = load(join(src, 'styles/LoginScreen.styles.ts'));
theme.setActiveScheme('dark');
assert.equal(login.authColors.background, dark.paper);
assert.equal(login.authColors.text, dark.ink);
theme.setActiveScheme('light');
assert.equal(login.authColors.background, light.paper);

// ---------- no colour written directly in a screen or style file ----------
const hex = /#[0-9A-Fa-f]{3,8}\b/;
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const offenders = walk(src)
  .filter(
    (file) =>
      /\.(ts|tsx)$/.test(file) &&
      !file.endsWith('theme.ts') &&
      !file.includes('AddReviewModal'),
  )
  .filter((file) => hex.test(readFileSync(file, 'utf8')));
assert.deepEqual(
  offenders,
  [],
  'colours must come from theme.ts so dark mode covers them',
);

// ---------- theme mode choice ----------
assert.equal(mode.parseThemeMode('dark'), 'dark');
assert.equal(mode.parseThemeMode('light'), 'light');
assert.equal(mode.parseThemeMode('system'), 'system');
for (const bad of [null, undefined, '', 'DARK', 'auto', '{}'])
  assert.equal(mode.parseThemeMode(bad), 'system');
assert.equal(mode.resolveScheme('system', 'dark'), 'dark');
assert.equal(mode.resolveScheme('system', 'light'), 'light');
assert.equal(mode.resolveScheme('system', null), 'light');
assert.equal(mode.resolveScheme('light', 'dark'), 'light');
assert.equal(mode.resolveScheme('dark', 'light'), 'dark');
assert.deepEqual(plain(mode.THEME_MODES), ['system', 'light', 'dark']);

console.log(
  'PASS: dark palette, contrast, live colours, themed styles in both schemes, mode choice',
);

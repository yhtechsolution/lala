# Smart search (mobile app)

A traveller types a sentence in the search box and taps **Smart search**. The app turns it into the filters it already has: city, price range, minimum rating, sort order and amenities. The listing results then come from the normal search code, so the AI never decides which guesthouses exist or what they cost.

## How it works

1. The app builds a list of the real cities, amenities and guesthouse names from the live listings.
2. Two readers interpret the sentence:
   - **Rule-based reader** (`smartSearch.ts`, no internet needed): understands phrases such as "under P800", "between 300 and 700", "4 stars and above", "cheap", "top rated" and known city, amenity and guesthouse names.
   - **Gemini** (`smartSearchAi.ts`, through Firebase AI Logic): understands looser wording. It may only choose cities, amenities and names from the real lists.
3. The AI's answer is checked (unknown cities or amenities are dropped, prices and ratings are bounds-checked) and merged with the rule-based reading. If the AI fails, times out after 8 seconds or returns nothing, the rule-based reading is used, so search still works offline and during the demo.
4. A banner shows exactly which filters were applied, with a clear button.

## Setup

Uses the same Firebase AI Logic setup as the web portal (see `ai-features.md`): enable it once in the Firebase console with the Gemini Developer API on the free Spark plan. Nothing else to install.

Optional variables in `mobile/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_GEMINI_MODEL` | `gemini-2.5-flash` | Model name; change it if the model is retired |
| `EXPO_PUBLIC_AI_SEARCH` | on | Set to `off` to use the rule-based reader only |

## Tests

`npm run test:smart` in `mobile/` (add `"test:smart": "node tests/smart-search.test.mjs"` to `package.json` scripts). It covers the rule-based reader, checking of AI output, merging, the labels shown to the traveller, and the new amenity filter. `npm run test:search` still passes.

## Known limits

- The AI call has not been run on a real phone. The app bundles for Android with the AI code, but the Firebase SDK does not clearly list React Native as supported for AI Logic. Try it once on a device. If it fails, the app falls back silently to the rule-based reader.
- App Check is not enabled on mobile, so the free AI quota could be used by anyone who copies the app's Firebase config. Keep `EXPO_PUBLIC_AI_SEARCH=off` for any public build until that is set up.
- Answers are remembered for the session to save quota. The free tier has rate limits.
- Amenity filtering matches the amenity names admins typed, so inconsistent spelling in the data limits results.

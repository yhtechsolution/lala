# AI features (web admin portal)

Two admin-only features use Gemini through Firebase AI Logic. There is no server of our own and no API key in the code.

## What they do

| Feature | Where | What the AI receives | What happens to the result |
|---|---|---|---|
| Draft description with AI | Add/Edit guesthouse form | Name, city, country, price, the amenities already typed, the description already typed, and the "Notes for the AI" box | Fills the description and adds amenities to the form. Nothing is saved until the admin presses Save. |
| AI summary | Dashboard | Aggregate figures only: totals, guesthouses and average price per city, top-rated and cheapest guesthouse | Shown as text on the page. Never stored. |

No customer data, emails, phone numbers or ratings by person are ever sent.

## One-time setup

1. Firebase console, Build, **AI Logic**, Get started. Choose **Gemini Developer API** and enable it. Keep the project on the free Spark plan; the free tier needs a project that is not linked to billing.
2. Add the optional settings to `web/.env` (see `web/.env.example`):
   - `VITE_GEMINI_MODEL` defaults to `gemini-2.5-flash`. If the console or the error message says the model is unavailable, set a current one.
3. Restart `npm run dev`.

## Protecting the quota (App Check, recommended before the demo)

Without it, anyone who copies the project's public Firebase config could spend the free AI quota.

1. Firebase console, App Check, register the web app with **reCAPTCHA v3** and copy the site key.
2. Put the key in `web/.env` as `VITE_APPCHECK_SITE_KEY`.
3. For local development a debug token is printed in the browser console. Add it under App Check, Manage debug tokens.
4. In App Check, APIs, enforce it for **Firebase AI Logic** only after you have seen requests verified.

## Design rules

- The AI is told to use only the supplied facts and never invent amenities, distances or awards. Output is still checked by the admin before saving.
- Output is cleaned (markdown stripped), length-limited and parsed before it reaches the page.
- AI never touches ratings, favourites or accounts, so the security rules stay the only authority on those.
- The AI code loads only when a button is pressed.

## Tests

`npm test` in `web/` runs `src/test/ai.test.ts` (prompts, parsing, statistics, errors) and `src/test/ai-form.test.tsx` (the form fills text but never saves). The real Gemini call is not covered by automated tests; try both buttons by hand once the console setup is done.

## Known limits

- The free tier has rate limits. A burst of clicks shows a "limit reached" message.
- Descriptions are only as good as the notes supplied.
- The model name may need updating as Google retires models.

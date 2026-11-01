// Calls Gemini through Firebase AI Logic to understand a travel request. The result
// is always checked against the real cities and amenities (see sanitizePlan), and the
// rule-based reader in smartSearch.ts is used whenever the AI is unavailable, slow
// or returns nothing useful, so searching never depends on the AI working.
import { firebaseApp } from '../config/firebase';
import {
  buildSearchPrompt,
  isEmptyPlan,
  localInterpret,
  mergePlans,
  sanitizePlan,
  SearchPlan,
  Vocabulary,
} from './smartSearch';

// Model names change over time; set EXPO_PUBLIC_GEMINI_MODEL to switch without a code change.
const MODEL_NAME = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
// Set EXPO_PUBLIC_AI_SEARCH=off to use the rule-based reader only.
const AI_ENABLED = process.env.EXPO_PUBLIC_AI_SEARCH !== 'off';
const AI_TIMEOUT_MS = 8000;
const CACHE_LIMIT = 20;

export type SmartSearchResult = { plan: SearchPlan; source: 'ai' | 'local' };

// Repeating a question costs nothing: answers are remembered for this session, which
// also protects the free AI quota.
const cache = new Map<string, SearchPlan>();

async function askModel(
  query: string,
  vocabulary: Vocabulary,
): Promise<SearchPlan> {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const sdk = await import('firebase/ai');
  const ai = sdk.getAI(firebaseApp, { backend: new sdk.GoogleAIBackend() });
  const model = sdk.getGenerativeModel(
    ai,
    {
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: sdk.Schema.object({
          properties: {
            city: sdk.Schema.string(),
            name: sdk.Schema.string(),
            minPrice: sdk.Schema.number(),
            maxPrice: sdk.Schema.number(),
            minRating: sdk.Schema.number(),
            sort: sdk.Schema.enumString({
              enum: ['priceAsc', 'priceDesc', 'rating'],
            }),
            amenities: sdk.Schema.array({ items: sdk.Schema.string() }),
          },
          optionalProperties: [
            'city',
            'name',
            'minPrice',
            'maxPrice',
            'minRating',
            'sort',
            'amenities',
          ],
        }),
      },
    },
    { timeout: AI_TIMEOUT_MS },
  );
  const result = await model.generateContent(
    buildSearchPrompt(query, vocabulary),
  );
  const text = result.response
    .text()
    .trim()
    .replace(/^```(?:json)?|```$/g, '');
  return sanitizePlan(JSON.parse(text), vocabulary);
}

export async function interpretSearch(
  query: string,
  vocabulary: Vocabulary,
): Promise<SmartSearchResult> {
  const local = localInterpret(query, vocabulary);
  if (!AI_ENABLED || !firebaseApp) return { plan: local, source: 'local' };
  const key = query.trim().toLowerCase();
  const remembered = cache.get(key);
  if (remembered) return { plan: remembered, source: 'ai' };
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('AI timed out')),
        AI_TIMEOUT_MS,
      );
    });
    const ai = await Promise.race([
      askModel(query, vocabulary),
      timeout,
    ]).finally(() => clearTimeout(timer));
    if (isEmptyPlan(ai)) return { plan: local, source: 'local' };
    const plan = mergePlans(ai, local);
    if (cache.size >= CACHE_LIMIT)
      cache.delete(cache.keys().next().value as string);
    cache.set(key, plan);
    return { plan, source: 'ai' };
  } catch {
    return { plan: local, source: 'local' };
  }
}

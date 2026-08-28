import { randomUUID } from "node:crypto";

export type SpecificationDraftRows = Record<
  string,
  {
    value: string;
    sourceUrl: string;
    sourceType: string;
    confidence: string;
  }
>;

type StoredDraft = {
  productId: string;
  rows: SpecificationDraftRows;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function createSpecificationDraftStore(
  options: { now?: () => number } = {},
) {
  const now = options.now ?? Date.now;
  const drafts = new Map<string, StoredDraft>();

  function pruneExpired(): void {
    const currentTime = now();
    for (const [token, draft] of drafts) {
      if (currentTime >= draft.expiresAt) drafts.delete(token);
    }
  }

  return {
    saveDraft(productId: string, rows: SpecificationDraftRows): string {
      pruneExpired();
      const token = randomUUID();
      drafts.set(token, { productId, rows, expiresAt: now() + DEFAULT_TTL_MS });
      return token;
    },

    takeDraft(productId: string, token: string): SpecificationDraftRows | null {
      const draft = drafts.get(token);
      if (!draft || draft.productId !== productId) return null;

      drafts.delete(token);
      if (now() >= draft.expiresAt) return null;

      return draft.rows;
    },

    clearProductDrafts(productId: string): void {
      for (const [token, draft] of drafts) {
        if (draft.productId === productId) drafts.delete(token);
      }
    },
  };
}

const specificationDraftStore = createSpecificationDraftStore();

export const saveSpecificationDraft = specificationDraftStore.saveDraft;
export const takeSpecificationDraft = specificationDraftStore.takeDraft;
export const clearProductSpecificationDrafts =
  specificationDraftStore.clearProductDrafts;

export default specificationDraftStore;

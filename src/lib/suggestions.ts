/** Shared by the suggestions route handler and the search field. */

export const MIN_SUGGESTION_QUERY_LENGTH = 2;
export const MAX_SUGGESTIONS = 8;

export type ArtifactSuggestion = {
  name: string;
  group?: string;
  latestVersion: string;
};

export type SuggestionsResponse = {
  suggestions: ArtifactSuggestion[];
};

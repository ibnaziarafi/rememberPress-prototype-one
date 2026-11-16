export type CoverTheme = 'linen-forest' | 'ivory-botanical' | 'slate-cloth' | 'charcoal-foil';

export type TrimSize = '6x9' | '5.5x8.5' | '8x10';

export type InteriorColorMode = 'color' | 'grayscale';

export type FontScale = 'compact' | 'classic' | 'large-print';

export type WritingTone =
  | 'Warm Memoir'
  | 'Preserve Spoken Voice'
  | 'Crisp Literary'
  | 'Legacy Biography';

export type PhotoPlacement =
  | 'chapter-opener'
  | 'framed-figure'
  | 'full-width'
  | 'side-by-side';

export type PromptCategory =
  | 'Childhood & Early Days'
  | 'Family & Roots'
  | 'Love & Companionship'
  | 'Craft, Work & Calling'
  | 'Turning Points'
  | 'Traditions & Table'
  | 'Wisdom & Legacy';

export interface BookSettings {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  dedication: string;
  coverTheme: CoverTheme;
  coverImageUrl: string;
  trimSize: TrimSize;
  interiorColorMode: InteriorColorMode;
  fontScale: FontScale;
  includeQrAudioArchive: boolean;
  includeDropCaps: boolean;
  editionYear: string;
}

export interface MemoryPhoto {
  id: string;
  chapterId: string | null;
  imageUrl: string;
  caption: string;
  storyNarrative: string;
  memoryHint: string;
  yearLabel: string;
  locationLabel: string;
  placement: PhotoPlacement;
  followUpQuestions: string[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  promptQuestion: string;
  epigraph: string;
  pullQuote: string;
  body: string;
  transcript: string;
  audioUrl: string | null;
  audioDurationSeconds: number;
  writingTone: WritingTone;
  followUpQuestions: string[];
  updatedAt: string;
}

export interface GuidedPrompt {
  id: string;
  category: PromptCategory;
  question: string;
  memoryTriggers: string[];
  coachingTip: string;
  estimatedMinutes: number;
  isCustom: boolean;
  answeredChapterId: string | null;
}

export interface BookWorkspaceData {
  settings: BookSettings;
  chapters: Chapter[];
  photos: MemoryPhoto[];
  prompts: GuidedPrompt[];
}

export interface TranscribeAndDraftResponse {
  transcript: string;
  chapter: {
    title: string;
    subtitle: string;
    epigraph: string;
    pullQuote: string;
    body: string;
    followUpQuestions: string[];
  };
  audioUrl: string | null;
}

export interface DescribePhotoResponse {
  caption: string;
  storyNarrative: string;
  yearLabel: string;
  memoryQuestions: string[];
}

export interface GeneratedPromptsResponse {
  prompts: Array<{
    question: string;
    memoryTriggers: string[];
    coachingTip: string;
    estimatedMinutes: number;
  }>;
}

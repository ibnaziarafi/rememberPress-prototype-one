import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type {
  BookSettings,
  BookWorkspaceData,
  Chapter,
  GuidedPrompt,
  MemoryPhoto,
} from './types';
import { TopBar, type ActiveTab } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { InterviewStudioView } from './components/InterviewStudioView';
import { PhotoStoriesView } from './components/PhotoStoriesView';
import { BookLayoutView } from './components/BookLayoutView';
import { parseJsonResponse } from './utils/api';

export default function App() {
  const [workspace, setWorkspace] = useState<BookWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedPrompt, setSelectedPrompt] = useState<GuidedPrompt | null>(null);
  const [selectedLayoutChapterId, setSelectedLayoutChapterId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBook() {
      try {
        const res = await fetch('/api/book');
        const data = await parseJsonResponse<BookWorkspaceData>(
          res,
          'Could not load Remember Press workspace'
        );
        setWorkspace(data);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load workspace.');
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, []);

  function handleSelectPromptForInterview(prompt: GuidedPrompt) {
    setSelectedPrompt(prompt);
    setActiveTab('interview');
  }

  function handleChapterSaved(chapter: Chapter) {
    setWorkspace((prev) => {
      if (!prev) return prev;
      const updatedChapters = [...prev.chapters, chapter].sort((a, b) => a.order - b.order);
      const updatedPrompts = prev.prompts.map((p) =>
        p.question === chapter.promptQuestion && !p.answeredChapterId
          ? { ...p, answeredChapterId: chapter.id }
          : p
      );
      return {
        ...prev,
        chapters: updatedChapters,
        prompts: updatedPrompts,
      };
    });
  }

  async function handleAppendStoryToChapter(chapterId: string, storyParagraph: string) {
    if (!workspace) return;
    const target = workspace.chapters.find((c) => c.id === chapterId);
    if (!target) return;
    const updatedBody = `${target.body.trim()}\n\n${storyParagraph.trim()}`;
    const res = await fetch(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: updatedBody }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Chapter;
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((c) => (c.id === updated.id ? updated : c)),
            }
          : prev
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#57534E]">
        <div className="flex items-center gap-2.5 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#1B4332]" />
          <span>Opening Remember Press Studio...</span>
        </div>
      </div>
    );
  }

  if (loadError || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-6">
        <div className="max-w-md border border-[#E4E2DD] rounded-xl bg-white p-6 space-y-3 text-center">
          <p className="font-editorial text-lg font-semibold text-[#18181B]">
            Unable to open studio
          </p>
          <p className="text-sm text-[#57534E]">{loadError || 'Workspace data unavailable.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-white bg-[#1B4332] rounded-lg cursor-pointer"
          >
            Reload Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#18181B]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onStartRecording={() => setActiveTab('interview')}
      />

      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewView
            workspace={workspace}
            onNavigate={setActiveTab}
            onSelectPromptForInterview={handleSelectPromptForInterview}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewStudioView
            workspace={workspace}
            initialPrompt={selectedPrompt}
            onChapterSaved={handleChapterSaved}
            onPromptsUpdated={(prompts: GuidedPrompt[]) =>
              setWorkspace((prev) => (prev ? { ...prev, prompts } : prev))
            }
            onGoToLayout={(chapterId: string) => {
              setSelectedLayoutChapterId(chapterId);
              setActiveTab('layout');
            }}
          />
        )}

        {activeTab === 'photos' && (
          <PhotoStoriesView
            workspace={workspace}
            onPhotosUpdated={(photos: MemoryPhoto[]) =>
              setWorkspace((prev) => (prev ? { ...prev, photos } : prev))
            }
            onAppendStoryToChapter={handleAppendStoryToChapter}
          />
        )}

        {activeTab === 'layout' && (
          <BookLayoutView
            workspace={workspace}
            initialChapterId={selectedLayoutChapterId}
            onSettingsUpdated={(settings: BookSettings) =>
              setWorkspace((prev) => (prev ? { ...prev, settings } : prev))
            }
            onChaptersUpdated={(chapters: Chapter[]) =>
              setWorkspace((prev) => (prev ? { ...prev, chapters } : prev))
            }
          />
        )}
      </main>

      <footer className="no-print border-t border-[#E4E2DD] bg-[#FAF9F6] mt-16">
        <div className="max-w-[1360px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#57534E]">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-sm font-semibold text-[#18181B]">
              Remember Press
            </span>
            <span aria-hidden="true">·</span>
            <span>Heirloom Memoirs &amp; Spoken Story Publishing</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('interview')}
              className="hover:text-[#18181B] cursor-pointer"
            >
              Interview Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className="hover:text-[#18181B] cursor-pointer"
            >
              Photo Stories
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className="hover:text-[#18181B] cursor-pointer"
            >
              Book Layout
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { ArrowRight, BookOpen, Camera, Mic, Sparkles } from 'lucide-react';
import type { BookWorkspaceData, GuidedPrompt } from '../types';
import { ResilientImage } from './ResilientImage';
import type { ActiveTab } from './TopBar';

interface OverviewViewProps {
  workspace: BookWorkspaceData;
  onNavigate: (tab: ActiveTab) => void;
  onSelectPromptForInterview: (prompt: GuidedPrompt) => void;
}

export function OverviewView({
  workspace,
  onNavigate,
  onSelectPromptForInterview,
}: OverviewViewProps) {
  const { settings, chapters, photos, prompts } = workspace;

  const totalWords = chapters.reduce(
    (sum, ch) => sum + ch.body.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const totalMinutes = Math.round(
    chapters.reduce((sum, ch) => sum + (ch.audioDurationSeconds || 0), 0) / 60
  );
  const upcomingPrompts = prompts.filter((p) => !p.answeredChapterId).slice(0, 4);

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-16">
      {/* Split-Column Editorial Hero */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-wide text-[#1B4332]">
                Remember Press Publishing Studio
              </p>
              <h1
                className="font-editorial text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-tight text-[#18181B]"
                style={{ textWrap: 'balance' }}
              >
                Turn spoken memories into heirloom printed books.
              </h1>
              <p className="text-base leading-relaxed text-[#57534E] max-w-xl">
                Record relaxed voice interviews guided by thoughtful life questions, pair family
                photographs with rich written stories, and arrange everything into a print-ready
                hardcover edition with scannable audio keepsakes.
              </p>
            </div>

            <div className="pt-8 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => onNavigate('interview')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                Start Audio Interview
              </button>
              <button
                type="button"
                onClick={() => onNavigate('layout')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#18181B] bg-white border border-[#E4E2DD] rounded-lg hover:border-[#18181B]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Open Book Layout
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[340px] lg:min-h-[420px] rounded-xl overflow-hidden border border-[#E4E2DD] bg-[#EFECE6]">
              <ResilientImage
                src="/src/assets/images/hero_remember_press_1794804938137.jpg"
                alt="Open forest-green linen hardcover memoir book on an oak desk beside archival family photographs and a brass pen"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Manuscript Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E4E2DD] rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#E4E2DD]">
          <div className="p-5 space-y-1">
            <p className="text-xs text-[#57534E]">Active Book Manuscript</p>
            <p className="font-editorial text-lg font-semibold text-[#18181B] truncate">
              {settings.title}
            </p>
            <p className="text-xs text-[#57534E]">By {settings.authorName}</p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-[#57534E]">Chapters Drafted</p>
            <p className="text-2xl font-semibold text-[#18181B] tabular-nums">
              {chapters.length}
            </p>
            <p className="text-xs text-[#57534E] tabular-nums">
              {totalWords.toLocaleString()} words · {totalMinutes} min audio
            </p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-[#57534E]">Photo Memories</p>
            <p className="text-2xl font-semibold text-[#18181B] tabular-nums">{photos.length}</p>
            <p className="text-xs text-[#57534E]">
              {settings.interiorColorMode === 'color' ? 'Full color interior' : 'Classic grayscale'}
            </p>
          </div>
          <div className="p-5 space-y-1">
            <p className="text-xs text-[#57534E]">Print Specification</p>
            <p className="text-2xl font-semibold text-[#18181B] tabular-nums">
              {settings.trimSize.replace('x', ' × ')} in
            </p>
            <p className="text-xs text-[#57534E]">
              {settings.includeQrAudioArchive ? 'QR audio keepsakes enabled' : 'Standard print'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial 4-Step Mechanism */}
      <section className="space-y-8 pt-4 border-t border-[#E4E2DD]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-editorial text-2xl md:text-3xl font-semibold text-[#18181B]">
              From spoken recollection to bound edition
            </h2>
            <p className="text-sm text-[#57534E]">
              Built around the way people actually remember—through conversation, old photographs,
              and specific sensory cues rather than a blank page.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <button
            type="button"
            onClick={() => onNavigate('interview')}
            className="text-left group space-y-3 pt-4 border-t border-[#18181B]/15 hover:border-[#1B4332] transition-colors cursor-pointer"
          >
            <p className="font-mono text-xs text-[#1B4332] tabular-nums">01.</p>
            <h3 className="font-editorial text-lg font-semibold text-[#18181B] group-hover:text-[#1B4332] transition-colors">
              Guided Memory Prompts
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Browse curated Storyworth-style life questions paired with sensory memory triggers and
              warm coaching instructions, or tailor prompts to your family history.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('interview')}
            className="text-left group space-y-3 pt-4 border-t border-[#18181B]/15 hover:border-[#1B4332] transition-colors cursor-pointer"
          >
            <p className="font-mono text-xs text-[#1B4332] tabular-nums">02.</p>
            <h3 className="font-editorial text-lg font-semibold text-[#18181B] group-hover:text-[#1B4332] transition-colors">
              Audio Interview &amp; Transcription
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Record directly in your browser or upload phone interviews. Automated transcription
              captures every name and inflection and shapes it into a clean chapter draft.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('photos')}
            className="text-left group space-y-3 pt-4 border-t border-[#18181B]/15 hover:border-[#1B4332] transition-colors cursor-pointer"
          >
            <p className="font-mono text-xs text-[#1B4332] tabular-nums">03.</p>
            <h3 className="font-editorial text-lg font-semibold text-[#18181B] group-hover:text-[#1B4332] transition-colors">
              Photographs &amp; Story Captions
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Upload cherished snapshots, add a brief memory note, and let the studio compose
              evocative photo narratives and detail-driven follow-up questions.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('layout')}
            className="text-left group space-y-3 pt-4 border-t border-[#18181B]/15 hover:border-[#1B4332] transition-colors cursor-pointer"
          >
            <p className="font-mono text-xs text-[#1B4332] tabular-nums">04.</p>
            <h3 className="font-editorial text-lg font-semibold text-[#18181B] group-hover:text-[#1B4332] transition-colors">
              Book Layout &amp; Audio QR
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Reorder chapters, switch between full color or classic grayscale, inspect two-page
              book spreads, and embed QR codes linking pages to original voice recordings.
            </p>
          </button>
        </div>
      </section>

      {/* Upcoming Prompt Queue + Featured Photo Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4 border-t border-[#E4E2DD]">
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#18181B]">
                Next Questions in Your Story Queue
              </h2>
              <p className="text-sm text-[#57534E]">
                Choose any prompt below to open the recording studio with memory recall cues.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('interview')}
              className="text-sm font-medium text-[#1B4332] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              View all prompts
            </button>
          </div>

          <div className="divide-y divide-[#E4E2DD] border border-[#E4E2DD] rounded-xl bg-white">
            {upcomingPrompts.length === 0 ? (
              <div className="p-6 text-sm text-[#57534E]">
                All queued prompts have chapters drafted. Add custom questions or generate new
                personalized prompts in the Interview Studio.
              </div>
            ) : (
              upcomingPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#57534E]">
                      <span>{prompt.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">~{prompt.estimatedMinutes} min interview</span>
                    </div>
                    <p className="font-editorial text-base font-medium text-[#18181B]">
                      {prompt.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPromptForInterview(prompt)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B4332] border border-[#1B4332]/30 rounded-lg hover:bg-[#1B4332] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Record answer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#18181B]">
                Visual Memory Spotlight
              </h2>
              <p className="text-sm text-[#57534E]">
                Every uploaded photograph carries its own narrative.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('photos')}
              className="text-sm font-medium text-[#1B4332] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add photo
            </button>
          </div>

          {photos[0] ? (
            <div className="border border-[#E4E2DD] rounded-xl bg-white overflow-hidden">
              <div className="aspect-[4/3] bg-[#EFECE6]">
                <ResilientImage
                  src={photos[0].imageUrl}
                  alt={photos[0].caption}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#57534E]">
                  <span>{photos[0].yearLabel || 'Family Archive'}</span>
                  {photos[0].locationLabel && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{photos[0].locationLabel}</span>
                    </>
                  )}
                </div>
                <p className="font-editorial text-base font-semibold text-[#18181B]">
                  {photos[0].caption}
                </p>
                <p className="text-sm text-[#57534E] line-clamp-3 leading-relaxed">
                  {photos[0].storyNarrative}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('photos')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Describe &amp; assign photographs
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-[#E4E2DD] rounded-xl bg-white p-8 text-center space-y-3">
              <Sparkles className="w-6 h-6 mx-auto text-[#1B4332]" />
              <p className="text-sm text-[#57534E]">
                Upload a family photograph to generate a written story and memory prompts.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('photos')}
                className="px-4 py-2 text-xs font-medium text-white bg-[#1B4332] rounded-lg cursor-pointer"
              >
                Open Photo Stories
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

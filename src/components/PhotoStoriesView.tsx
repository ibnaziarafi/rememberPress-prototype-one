import { useState } from 'react';
import { BookPlus, Camera, Check, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import type {
  BookWorkspaceData,
  DescribePhotoResponse,
  MemoryPhoto,
  PhotoPlacement,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { compressImageFile, parseJsonResponse } from '../utils/api';

interface PhotoStoriesViewProps {
  workspace: BookWorkspaceData;
  onPhotosUpdated: (photos: MemoryPhoto[]) => void;
  onAppendStoryToChapter: (chapterId: string, storyParagraph: string) => Promise<void>;
}

const PLACEMENT_OPTIONS: Array<{ value: PhotoPlacement; label: string }> = [
  { value: 'framed-figure', label: 'Framed Figure with Caption' },
  { value: 'chapter-opener', label: 'Chapter Opener Spread' },
  { value: 'full-width', label: 'Full-Width Plate' },
  { value: 'side-by-side', label: 'Side-by-Side Pair' },
];

export function PhotoStoriesView({
  workspace,
  onPhotosUpdated,
  onAppendStoryToChapter,
}: PhotoStoriesViewProps) {
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string>('');
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [memoryHint, setMemoryHint] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [assignedChapterId, setAssignedChapterId] = useState<string>(
    workspace.chapters[0]?.id || ''
  );
  const [placement, setPlacement] = useState<PhotoPlacement>('framed-figure');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedNarrative, setGeneratedNarrative] = useState('');
  const [generatedYearLabel, setGeneratedYearLabel] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [appendedId, setAppendedId] = useState<string | null>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    try {
      const { dataUrl, mimeType } = await compressImageFile(file);
      setSelectedFileDataUrl(dataUrl);
      setSelectedMimeType(mimeType);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load image file.');
    }
  }

  async function handleDescribePhoto() {
    if (!selectedFileDataUrl) {
      setErrorMessage('Upload a photograph first so the studio can examine it.');
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const targetChapter = workspace.chapters.find((c) => c.id === assignedChapterId);
      const response = await fetch('/api/ai/describe-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedFileDataUrl,
          mimeType: selectedMimeType,
          memoryHint,
          chapterContext: targetChapter
            ? `${targetChapter.title}: ${targetChapter.subtitle}`
            : '',
        }),
      });
      const result = await parseJsonResponse<DescribePhotoResponse>(
        response,
        'Could not describe photograph'
      );
      setGeneratedCaption(result.caption);
      setGeneratedNarrative(result.storyNarrative);
      setGeneratedYearLabel(result.yearLabel);
      setGeneratedQuestions(result.memoryQuestions || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate photo story.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSavePhotoMemory() {
    if (!selectedFileDataUrl) return;
    setSavingPhoto(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedFileDataUrl,
          mimeType: selectedMimeType,
          chapterId: assignedChapterId || null,
          caption: generatedCaption || memoryHint || 'Family keepsake photograph',
          storyNarrative: generatedNarrative || memoryHint,
          memoryHint,
          yearLabel: generatedYearLabel,
          locationLabel,
          placement,
          followUpQuestions: generatedQuestions,
        }),
      });
      const created = await parseJsonResponse<MemoryPhoto>(res, 'Failed to save photo');
      onPhotosUpdated([created, ...workspace.photos]);

      setSelectedFileDataUrl('');
      setMemoryHint('');
      setLocationLabel('');
      setGeneratedCaption('');
      setGeneratedNarrative('');
      setGeneratedYearLabel('');
      setGeneratedQuestions([]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save photo.');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleUpdatePhotoMeta(
    photoId: string,
    patch: Partial<MemoryPhoto>
  ) {
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as MemoryPhoto;
      onPhotosUpdated(workspace.photos.map((p) => (p.id === photoId ? updated : p)));
    } catch {
      // Ignore transient edit errors
    }
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        onPhotosUpdated(workspace.photos.filter((p) => p.id !== photoId));
      }
    } catch {
      // Ignore
    }
  }

  async function handleAppendToChapter(photo: MemoryPhoto) {
    if (!photo.chapterId || !photo.storyNarrative) return;
    await onAppendStoryToChapter(photo.chapterId, photo.storyNarrative);
    setAppendedId(photo.id);
    window.setTimeout(() => setAppendedId(null), 2500);
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4E2DD] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#1B4332]">Visual Keepsake Studio</p>
          <h1 className="font-editorial text-3xl font-semibold text-[#18181B]">
            Add Photographs &amp; Describe Their Stories
          </h1>
          <p className="text-sm text-[#57534E] max-w-2xl">
            Upload archival prints or family snapshots, jot down who or where is pictured, and let
            the studio craft vivid book captions, multi-paragraph stories, and memory-jogging
            questions.
          </p>
        </div>
      </div>

      {/* Photo Upload + Story Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border border-[#E4E2DD] rounded-xl bg-white p-6">
        <div className="lg:col-span-5 space-y-4">
          {selectedFileDataUrl ? (
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#E4E2DD] bg-[#EFECE6]">
                <ResilientImage
                  src={selectedFileDataUrl}
                  alt="Uploaded memory preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332] hover:underline cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Choose a different photograph
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[4/3] p-6 border border-dashed border-[#D6D3CD] rounded-lg bg-[#FAF9F6] hover:border-[#1B4332] transition-colors cursor-pointer text-center space-y-2.5">
              <Camera className="w-7 h-7 text-[#1B4332]" />
              <span className="text-sm font-medium text-[#18181B]">
                Upload a family photograph
              </span>
              <span className="text-xs text-[#57534E] max-w-xs">
                Supports JPEG, PNG, and WebP. Scanned prints and phone photos work equally well.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1">
                Assign to Chapter
              </label>
              <select
                value={assignedChapterId}
                onChange={(e) => setAssignedChapterId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
              >
                <option value="">Unassigned (Book Gallery)</option>
                {workspace.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chapter {ch.order}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1">
                Page Layout Style
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as PhotoPlacement)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
              >
                {PLACEMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1">
                What do you remember about this photo?
              </label>
              <input
                type="text"
                value={memoryHint}
                onChange={(e) => setMemoryHint(e.target.value)}
                placeholder="e.g., My father beside his 1968 pickup truck in Duluth"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="e.g., Duluth Harbor"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDescribePhoto}
              disabled={isGenerating || !selectedFileDataUrl}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Examining Photograph...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Describe &amp; Write Story from Photo
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] text-xs text-[#991B1B]">
              {errorMessage}
            </div>
          )}

          {(generatedCaption || generatedNarrative || selectedFileDataUrl) && (
            <div className="pt-4 border-t border-[#E4E2DD] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Book Figure Caption
                  </label>
                  <input
                    type="text"
                    value={generatedCaption}
                    onChange={(e) => setGeneratedCaption(e.target.value)}
                    placeholder="Figure caption for printed book page"
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Year / Era
                  </label>
                  <input
                    type="text"
                    value={generatedYearLabel}
                    onChange={(e) => setGeneratedYearLabel(e.target.value)}
                    placeholder="e.g., Summer 1974"
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Photo Story Narrative
                </label>
                <textarea
                  rows={5}
                  value={generatedNarrative}
                  onChange={(e) => setGeneratedNarrative(e.target.value)}
                  placeholder="Write or refine the story behind this photograph..."
                  className="w-full p-3 text-sm leading-relaxed bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              {generatedQuestions.length > 0 && (
                <div className="p-3.5 rounded-lg bg-[#F2EFE9] space-y-1.5">
                  <p className="text-xs font-semibold text-[#1B4332]">
                    Memory Questions Inspired by This Photograph
                  </p>
                  <ul className="space-y-1 text-xs text-[#18181B]">
                    {generatedQuestions.map((q, i) => (
                      <li key={i}>• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePhotoMemory}
                  disabled={savingPhoto || !selectedFileDataUrl}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] cursor-pointer disabled:opacity-50"
                >
                  {savingPhoto ? 'Saving...' : 'Save Photo to Book'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Photo Stories Archive */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#18181B]">
            Book Photo Archive ({workspace.photos.length})
          </h2>
          <p className="text-xs text-[#57534E]">
            {workspace.settings.interiorColorMode === 'grayscale'
              ? 'Previewing in Classic Grayscale print mode'
              : 'Previewing in Full Color print mode'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {workspace.photos.map((photo) => {
            const chapter = workspace.chapters.find((c) => c.id === photo.chapterId);
            return (
              <article
                key={photo.id}
                className="border border-[#E4E2DD] rounded-xl bg-white overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#EFECE6]">
                  <ResilientImage
                    src={photo.imageUrl}
                    alt={photo.caption}
                    grayscale={workspace.settings.interiorColorMode === 'grayscale'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                      <span>
                        {photo.yearLabel || 'Undated'}
                        {photo.locationLabel ? ` · ${photo.locationLabel}` : ''}
                      </span>
                      <span>
                        {chapter ? `Chapter ${chapter.order}` : 'Unassigned'}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={photo.caption}
                      onChange={(e) =>
                        onPhotosUpdated(
                          workspace.photos.map((p) =>
                            p.id === photo.id ? { ...p, caption: e.target.value } : p
                          )
                        )
                      }
                      onBlur={(e) => handleUpdatePhotoMeta(photo.id, { caption: e.target.value })}
                      className="w-full font-editorial text-base font-semibold text-[#18181B] bg-transparent border-b border-transparent hover:border-[#E4E2DD] focus:border-[#1B4332] focus:outline-none pb-1"
                    />

                    <textarea
                      rows={4}
                      value={photo.storyNarrative}
                      onChange={(e) =>
                        onPhotosUpdated(
                          workspace.photos.map((p) =>
                            p.id === photo.id ? { ...p, storyNarrative: e.target.value } : p
                          )
                        )
                      }
                      onBlur={(e) =>
                        handleUpdatePhotoMeta(photo.id, { storyNarrative: e.target.value })
                      }
                      className="w-full text-sm text-[#57534E] leading-relaxed bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg p-3 focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#E4E2DD] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={photo.chapterId || ''}
                        onChange={(e) =>
                          handleUpdatePhotoMeta(photo.id, {
                            chapterId: e.target.value || null,
                          })
                        }
                        className="px-2.5 py-1.5 text-xs bg-white border border-[#E4E2DD] rounded-md"
                      >
                        <option value="">Unassigned</option>
                        {workspace.chapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            Ch. {ch.order}: {ch.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={photo.placement}
                        onChange={(e) =>
                          handleUpdatePhotoMeta(photo.id, {
                            placement: e.target.value as PhotoPlacement,
                          })
                        }
                        className="px-2.5 py-1.5 text-xs bg-white border border-[#E4E2DD] rounded-md"
                      >
                        {PLACEMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {photo.chapterId && (
                        <button
                          type="button"
                          onClick={() => handleAppendToChapter(photo)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1B4332] bg-[#F2EFE9] rounded-md hover:bg-[#E4E2DD] transition-colors cursor-pointer"
                        >
                          {appendedId === photo.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added to Chapter
                            </>
                          ) : (
                            <>
                              <BookPlus className="w-3.5 h-3.5" />
                              Add Story to Chapter
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        aria-label="Delete photograph"
                        className="p-1.5 text-[#57534E] hover:text-[#B91C1C] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

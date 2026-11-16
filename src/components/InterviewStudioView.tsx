import { useEffect, useRef, useState } from 'react';
import {
  Check,
  FileAudio,
  Lightbulb,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Upload,
} from 'lucide-react';
import type {
  BookWorkspaceData,
  Chapter,
  GuidedPrompt,
  PromptCategory,
  TranscribeAndDraftResponse,
  WritingTone,
} from '../types';
import { blobToBase64, parseJsonResponse } from '../utils/api';

interface InterviewStudioViewProps {
  workspace: BookWorkspaceData;
  initialPrompt: GuidedPrompt | null;
  onChapterSaved: (chapter: Chapter) => void;
  onPromptsUpdated: (prompts: GuidedPrompt[]) => void;
  onGoToLayout: (chapterId: string) => void;
}

const PROMPT_CATEGORIES: Array<'All' | PromptCategory> = [
  'All',
  'Childhood & Early Days',
  'Family & Roots',
  'Love & Companionship',
  'Craft, Work & Calling',
  'Turning Points',
  'Traditions & Table',
  'Wisdom & Legacy',
];

const WRITING_TONES: WritingTone[] = [
  'Warm Memoir',
  'Preserve Spoken Voice',
  'Crisp Literary',
  'Legacy Biography',
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function InterviewStudioView({
  workspace,
  initialPrompt,
  onChapterSaved,
  onPromptsUpdated,
  onGoToLayout,
}: InterviewStudioViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | PromptCategory>('All');
  const [selectedPrompt, setSelectedPrompt] = useState<GuidedPrompt | null>(
    initialPrompt || workspace.prompts.find((p) => !p.answeredChapterId) || workspace.prompts[0] || null
  );

  // Custom question & AI prompt personalization
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customCategory, setCustomCategory] = useState<PromptCategory>('Childhood & Early Days');
  const [lifeContextInput, setLifeContextInput] = useState('');
  const [generatingPrompts, setGeneratingPrompts] = useState(false);

  // Input mode & Recording state
  const [inputMode, setInputMode] = useState<'record' | 'upload' | 'notes'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [rawNotes, setRawNotes] = useState('');

  // Storyteller metadata
  const [storytellerName, setStorytellerName] = useState(workspace.settings.authorName || '');
  const [writingTone, setWritingTone] = useState<WritingTone>('Warm Memoir');
  const [memoryNotes, setMemoryNotes] = useState('');

  // AI processing & generated chapter draft
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<TranscribeAndDraftResponse | null>(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableSubtitle, setEditableSubtitle] = useState('');
  const [editableEpigraph, setEditableEpigraph] = useState('');
  const [editablePullQuote, setEditablePullQuote] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [savingChapter, setSavingChapter] = useState(false);
  const [savedChapterId, setSavedChapterId] = useState<string | null>(null);

  // MediaRecorder & Waveform refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setSelectedPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    return () => {
      stopVisualizer();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, []);

  const filteredPrompts = workspace.prompts.filter((p) =>
    selectedCategory === 'All' ? true : p.category === selectedCategory
  );

  function stopVisualizer() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  function startVisualizer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteTimeDomainData(dataArray);
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#F2EFE9';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1B4332';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        animFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      // Waveform visualization is progressive enhancement
    }
  }

  async function handleStartRecording() {
    setErrorMessage(null);
    setSavedChapterId(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const supportsType = (mime: string) =>
        typeof MediaRecorder !== 'undefined' &&
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported(mime);

      const preferredMime = supportsType('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : supportsType('audio/webm')
          ? 'audio/webm'
          : supportsType('audio/mp4')
            ? 'audio/mp4'
            : '';

      let recorder: MediaRecorder;
      try {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime, audioBitsPerSecond: 64000 })
          : new MediaRecorder(stream, { audioBitsPerSecond: 64000 });
      } catch {
        recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const resolvedType = recorder.mimeType || preferredMime || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type: resolvedType });
        setAudioBlob(blob);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        stopVisualizer();
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      setAudioBlob(null);
      startVisualizer(stream);

      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMessage(
        'Microphone access was blocked or unavailable. Allow microphone permission in your browser, upload an audio file, or switch to Spoken Notes.'
      );
    }
  }

  function handlePauseResume() {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      setIsPaused(true);
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (rec.state === 'paused') {
      rec.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
  }

  function handleStopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }

  function handleResetAudio() {
    handleStopRecording();
    setAudioBlob(null);
    setUploadedFileName('');
    setElapsedSeconds(0);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
  }

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Audio file exceeds 20 MB. Please upload a shorter clip (under 20 MB).');
      return;
    }
    setErrorMessage(null);
    setSavedChapterId(null);
    setAudioBlob(file);
    setUploadedFileName(file.name);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(objectUrl);

    const probe = new Audio(objectUrl);
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration)) {
        setElapsedSeconds(Math.round(probe.duration));
      }
    };
  }

  async function handleTranscribeAndDraft() {
    setErrorMessage(null);
    setSavedChapterId(null);

    if (inputMode !== 'notes' && !audioBlob) {
      setErrorMessage('Record an interview or upload an audio file first.');
      return;
    }
    if (inputMode !== 'notes' && audioBlob && audioBlob.size === 0) {
      setErrorMessage('The audio recording is empty. Please record at least a couple of seconds and try again.');
      return;
    }
    if (inputMode === 'notes' && !rawNotes.trim()) {
      setErrorMessage('Enter your spoken story notes before generating a chapter draft.');
      return;
    }

    setIsProcessing(true);
    try {
      let audioBase64: string | undefined;
      let mimeType: string | undefined;

      if (inputMode !== 'notes' && audioBlob) {
        if (audioBlob.size > 20 * 1024 * 1024) {
          throw new Error('Recording exceeds 20 MB upload limit. Please keep single clips under ~15 minutes.');
        }
        audioBase64 = await blobToBase64(audioBlob);
        mimeType =
          audioBlob.type ||
          (uploadedFileName.toLowerCase().endsWith('.m4a')
            ? 'audio/mp4'
            : uploadedFileName.toLowerCase().endsWith('.mp3')
              ? 'audio/mpeg'
              : uploadedFileName.toLowerCase().endsWith('.wav')
                ? 'audio/wav'
                : 'audio/webm');
      }

      const response = await fetch('/api/ai/transcribe-and-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          transcriptOverride: inputMode === 'notes' ? rawNotes : undefined,
          promptQuestion: selectedPrompt?.question || '',
          storytellerName: storytellerName.trim() || workspace.settings.authorName,
          writingTone,
          memoryNotes,
        }),
      });

      const result = await parseJsonResponse<TranscribeAndDraftResponse>(
        response,
        'Failed to transcribe and draft chapter'
      );
      setDraftResult(result);
      setEditableTranscript(result.transcript);
      setEditableTitle(result.chapter.title);
      setEditableSubtitle(result.chapter.subtitle);
      setEditableEpigraph(result.chapter.epigraph);
      setEditablePullQuote(result.chapter.pullQuote);
      setEditableBody(result.chapter.body);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveChapter() {
    if (!editableTitle.trim() || !editableBody.trim()) return;
    setSavingChapter(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editableTitle.trim(),
          subtitle: editableSubtitle.trim(),
          promptQuestion: selectedPrompt?.question || '',
          epigraph: editableEpigraph.trim(),
          pullQuote: editablePullQuote.trim(),
          body: editableBody.trim(),
          transcript: editableTranscript.trim(),
          audioUrl: draftResult?.audioUrl || null,
          audioDurationSeconds: elapsedSeconds,
          writingTone,
          followUpQuestions: draftResult?.chapter.followUpQuestions || [],
          promptId: selectedPrompt?.id,
        }),
      });
      const saved = await parseJsonResponse<Chapter>(response, 'Could not save chapter');
      setSavedChapterId(saved.id);
      onChapterSaved(saved);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save chapter.');
    } finally {
      setSavingChapter(false);
    }
  }

  async function handleAddCustomPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!customQuestionText.trim()) return;
    try {
      const res = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: customCategory,
          question: customQuestionText.trim(),
        }),
      });
      const created = await parseJsonResponse<GuidedPrompt>(res, 'Failed to save custom question');
      onPromptsUpdated([created, ...workspace.prompts]);
      setSelectedPrompt(created);
      setCustomQuestionText('');
      setShowCustomForm(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save custom question.');
    }
  }

  async function handleGeneratePersonalizedPrompts() {
    setGeneratingPrompts(true);
    setErrorMessage(null);
    try {
      const categoryToUse =
        selectedCategory === 'All' ? 'Childhood & Early Days' : selectedCategory;
      const res = await fetch('/api/ai/guided-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryToUse,
          lifeContext: lifeContextInput,
          existingTitles: workspace.chapters.map((c) => c.title),
        }),
      });
      const data = await parseJsonResponse<{ prompts: GuidedPrompt[] }>(
        res,
        'Could not generate prompts'
      );
      const newPrompts = data.prompts || [];
      onPromptsUpdated([...newPrompts, ...workspace.prompts]);
      if (newPrompts[0]) setSelectedPrompt(newPrompts[0]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Prompt generation failed.');
    } finally {
      setGeneratingPrompts(false);
    }
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4E2DD] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#1B4332]">Audio Interview &amp; Memory Studio</p>
          <h1 className="font-editorial text-3xl font-semibold text-[#18181B]">
            Record a Conversation, Draft a Chapter
          </h1>
          <p className="text-sm text-[#57534E] max-w-2xl">
            Pick a guided life question, use the sensory memory cues to spark recall, and speak
            naturally. Audio is transcribed verbatim and edited into a formatted manuscript chapter.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Guided Question Library & Memory Coach */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Active Memory Recall Coach */}
          {selectedPrompt && (
            <div className="border border-[#E4E2DD] rounded-xl bg-white p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs text-[#57534E]">
                  <span>{selectedPrompt.category}</span>
                  <span className="tabular-nums">~{selectedPrompt.estimatedMinutes} min target</span>
                </div>
                <h2 className="font-editorial text-xl font-semibold text-[#18181B] leading-snug">
                  {selectedPrompt.question}
                </h2>
              </div>

              <div className="bg-[#F2EFE9] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1B4332]">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Memory Recall Triggers</span>
                </div>
                <ul className="space-y-2 text-sm text-[#18181B]">
                  {selectedPrompt.memoryTriggers.map((trigger, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="font-mono text-xs text-[#57534E] pt-0.5 tabular-nums">
                        0{i + 1}.
                      </span>
                      <span>{trigger}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#57534E] pt-2 border-t border-[#E4E2DD] leading-relaxed">
                  Coach note: {selectedPrompt.coachingTip}
                </p>
              </div>
            </div>
          )}

          {/* Question Library & Custom Prompt Builder */}
          <div className="border border-[#E4E2DD] rounded-xl bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#18181B]">Story Question Library</h3>
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Question
              </button>
            </div>

            {showCustomForm && (
              <form
                onSubmit={handleAddCustomPrompt}
                className="p-4 rounded-lg bg-[#FAF9F6] border border-[#E4E2DD] space-y-3"
              >
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as PromptCategory)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                >
                  {PROMPT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="Write a personal question for yourself or a family member..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-3 py-1.5 text-xs text-[#57534E] hover:text-[#18181B] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#1B4332] rounded-lg cursor-pointer"
                  >
                    Save Question
                  </button>
                </div>
              </form>
            )}

            {/* AI Personalized Prompt Generator */}
            <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E4E2DD] space-y-2.5">
              <label className="block text-xs font-medium text-[#57534E]">
                Tailor new questions to a life era, hometown, or profession
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lifeContextInput}
                  onChange={(e) => setLifeContextInput(e.target.value)}
                  placeholder="e.g., Grew up in 1960s Chicago, nurse for 30 years"
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
                <button
                  type="button"
                  onClick={handleGeneratePersonalizedPrompts}
                  disabled={generatingPrompts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1B4332] bg-white border border-[#1B4332]/40 rounded-lg hover:bg-[#1B4332] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {generatingPrompts ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate Prompts
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#1B4332] text-white font-medium'
                        : 'bg-[#F2EFE9] text-[#57534E] hover:text-[#18181B]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Prompts List */}
            <div className="divide-y divide-[#E4E2DD] max-h-[380px] overflow-y-auto pr-1">
              {filteredPrompts.map((prompt) => {
                const isSelected = selectedPrompt?.id === prompt.id;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setSelectedPrompt(prompt)}
                    className={`w-full text-left py-3 px-2.5 transition-colors cursor-pointer rounded-md ${
                      isSelected ? 'bg-[#F2EFE9]' : 'hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#57534E] mb-1">
                      <span>{prompt.category}</span>
                      <span>
                        {prompt.answeredChapterId ? 'Drafted' : `${prompt.estimatedMinutes} min`}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#18181B] leading-snug">
                      {prompt.question}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Audio Recording, Transcription & Manuscript Draft */}
        <section className="lg:col-span-7 space-y-6">
          <div className="border border-[#E4E2DD] rounded-xl bg-white p-6 space-y-6">
            {/* Segmented Mode Switch */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('record')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'record'
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  Record Microphone
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  Upload Audio File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('notes')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'notes'
                      ? 'bg-white text-[#18181B] shadow-xs'
                      : 'text-[#57534E] hover:text-[#18181B]'
                  }`}
                >
                  Spoken Notes
                </button>
              </div>

              <span className="font-mono text-sm text-[#18181B] tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>

            {/* Recorder / Uploader / Notes Surface */}
            {inputMode === 'record' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#E4E2DD] bg-[#F2EFE9] overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={96}
                    className="w-full h-24 block"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        {audioBlob ? 'Record Again' : 'Start Recording'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handlePauseResume}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#18181B] bg-[#F2EFE9] border border-[#E4E2DD] rounded-lg hover:bg-[#E4E2DD]/60 transition-colors cursor-pointer"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-4 h-4" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#B91C1C] rounded-lg hover:bg-[#991B1B] transition-colors cursor-pointer"
                        >
                          <Square className="w-4 h-4" />
                          Stop Recording
                        </button>
                      </>
                    )}

                    {audioBlob && !isRecording && (
                      <button
                        type="button"
                        onClick={handleResetAudio}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#18181B] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[#57534E]">
                    {isRecording
                      ? isPaused
                        ? 'Recording paused'
                        : 'Listening to microphone...'
                      : audioBlob
                        ? 'Recording ready to transcribe'
                        : 'Press Start Recording and speak naturally'}
                  </p>
                </div>

                {audioPreviewUrl && !isRecording && (
                  <div className="pt-2">
                    <audio controls src={audioPreviewUrl} className="w-full h-10" />
                  </div>
                )}
              </div>
            )}

            {inputMode === 'upload' && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center p-8 border border-dashed border-[#D6D3CD] rounded-lg bg-[#FAF9F6] hover:border-[#1B4332] transition-colors cursor-pointer text-center space-y-2">
                  <Upload className="w-6 h-6 text-[#1B4332]" />
                  <span className="text-sm font-medium text-[#18181B]">
                    {uploadedFileName || 'Choose an interview recording (.mp3, .wav, .m4a, .webm)'}
                  </span>
                  <span className="text-xs text-[#57534E]">
                    Great for phone interviews, voice memos, or family recordings
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>

                {audioPreviewUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E2DD]">
                    <FileAudio className="w-4 h-4 text-[#1B4332] shrink-0" />
                    <audio controls src={audioPreviewUrl} className="w-full h-9" />
                  </div>
                )}
              </div>
            )}

            {inputMode === 'notes' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#57534E]">
                  Type or paste rough spoken recollections
                </label>
                <textarea
                  rows={6}
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Write down the memory exactly as you'd tell it out loud—names, places, little details, even out of order..."
                  className="w-full p-3.5 text-sm bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332] leading-relaxed"
                />
              </div>
            )}

            {/* Editorial Tone & Context Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E4E2DD]">
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                  Storyteller Name
                </label>
                <input
                  type="text"
                  value={storytellerName}
                  onChange={(e) => setStorytellerName(e.target.value)}
                  placeholder="e.g., Clara Vance"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                  Manuscript Voice &amp; Style
                </label>
                <select
                  value={writingTone}
                  onChange={(e) => setWritingTone(e.target.value as WritingTone)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                >
                  {WRITING_TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                  Spelling Hints (People, Towns, Dates)
                </label>
                <input
                  type="text"
                  value={memoryNotes}
                  onChange={(e) => setMemoryNotes(e.target.value)}
                  placeholder="Optional: e.g., Uncle Henrik, Cedar Cove, 1974"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] text-xs text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[#57534E]">
                Automated transcription + structured chapter drafting
              </p>
              <button
                type="button"
                onClick={handleTranscribeAndDraft}
                disabled={isProcessing || isRecording}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcribing &amp; Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Transcribe &amp; Draft Chapter
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Transcript & Manuscript Output */}
          {draftResult && (
            <div className="border border-[#E4E2DD] rounded-xl bg-white p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E4E2DD]">
                <div>
                  <p className="text-xs font-medium text-[#1B4332]">Generated Chapter Draft</p>
                  <h3 className="font-editorial text-xl font-semibold text-[#18181B]">
                    Review Transcript &amp; Manuscript
                  </h3>
                </div>

                {savedChapterId ? (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332]">
                      <Check className="w-4 h-4" />
                      Saved to book
                    </span>
                    <button
                      type="button"
                      onClick={() => onGoToLayout(savedChapterId)}
                      className="px-4 py-2 text-xs font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] cursor-pointer"
                    >
                      View in Book Layout
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveChapter}
                    disabled={savingChapter}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] cursor-pointer disabled:opacity-50"
                  >
                    {savingChapter ? 'Saving...' : 'Save Chapter to Book'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#57534E] mb-1">
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="w-full px-3 py-2 font-editorial text-base font-semibold bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57534E] mb-1">
                      Era / Setting Subtitle
                    </label>
                    <input
                      type="text"
                      value={editableSubtitle}
                      onChange={(e) => setEditableSubtitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Opening Epigraph
                  </label>
                  <input
                    type="text"
                    value={editableEpigraph}
                    onChange={(e) => setEditableEpigraph(e.target.value)}
                    className="w-full px-3 py-2 text-sm italic bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Formatted Manuscript Prose
                  </label>
                  <textarea
                    rows={10}
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full p-4 text-sm leading-relaxed bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Pull Quote Callout
                  </label>
                  <input
                    type="text"
                    value={editablePullQuote}
                    onChange={(e) => setEditablePullQuote(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E4E2DD] space-y-2">
                  <label className="block text-xs font-medium text-[#57534E]">
                    Verbatim Audio Transcript
                  </label>
                  <textarea
                    rows={4}
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    className="w-full p-3 text-xs leading-relaxed text-[#57534E] bg-[#F2EFE9] border border-[#E4E2DD] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                {draftResult.chapter.followUpQuestions?.length > 0 && (
                  <div className="p-4 rounded-lg bg-[#F2EFE9] space-y-2">
                    <p className="text-xs font-semibold text-[#1B4332]">
                      Follow-up Questions to Deepen This Memory
                    </p>
                    <ul className="space-y-1.5 text-sm text-[#18181B]">
                      {draftResult.chapter.followUpQuestions.map((q, idx) => (
                        <li key={idx}>• {q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  BookWorkspaceData,
  Chapter,
  GuidedPrompt,
  MemoryPhoto,
  WritingTone,
  PromptCategory,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'rememberpress-db.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message || fallback;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // Raw message is already plain text
  }
  return raw;
}

function buildSeedWorkspace(): BookWorkspaceData {
  const now = new Date().toISOString();
  return {
    settings: {
      id: 'book-cedar-cove',
      title: 'The Years Between',
      subtitle: 'Stories of Cedar Cove, Family Tables & Second Acts',
      authorName: 'Clara Vance',
      dedication:
        'For Leo, Maya, and every grandchild who asks what the lake looked like before the highway arrived.',
      coverTheme: 'linen-forest',
      coverImageUrl: '/src/assets/images/sample_book_cover_1794804939349.jpg',
      trimSize: '6x9',
      interiorColorMode: 'color',
      fontScale: 'classic',
      includeQrAudioArchive: true,
      includeDropCaps: true,
      editionYear: '2026',
    },
    chapters: [
      {
        id: 'chap-01',
        order: 1,
        title: 'Cedar Dock at Seven O’Clock',
        subtitle: 'Summers on the northern shore, 1972–1976',
        promptQuestion:
          'What is a childhood place whose smells, light, or sounds you can still recall immediately?',
        epigraph:
          'We measured August not by the calendar, but by how warm the weathered planks stayed after sunset.',
        pullQuote:
          'My brother Leo always claimed he could hear the ferry whistle twenty minutes before anyone else on the point.',
        body: `Before the highway widened past Heron Creek, getting to my grandfather’s cabin meant an hour on gravel roads with the windows rolled halfway down. Even now, if I catch the scent of sun-warmed cedar and pine resin at the end of a long day, I am eight years old again, sitting barefoot at the end of the dock with my brother Leo.

Our grandfather built that dock in the spring of 1959 out of salvaged barn timbers. By the time we were old enough to dangle our heels in the shallows, the wood had bleached to a silver-gray that held the afternoon heat long after the sun dropped behind the spruce line. Leo was eleven—old enough to be trusted with the brass tackle box, though rarely patient enough to wait for a bite.

At seven o’clock each evening, the lake turned completely still, like dark tea cooling in a saucer. My grandmother would ring a cast-iron bell from the porch, twice for supper, once if she only wanted help shelling peas. We always waited until the second ring faded across the water before standing up, reluctant to trade the golden hour for indoor lamplight.`,
        transcript:
          'Well, if I close my eyes and think back to being eight years old, it’s always the dock at Cedar Cove. We drove up on gravel roads with the windows down. My grandfather built that dock in 1959 from barn timbers, bleached silver-gray. Leo was eleven, always holding the brass tackle box. At seven o’clock the lake went completely flat, and Grandma rang the cast-iron bell from the porch—twice for supper, once for shelling peas.',
        audioUrl: null,
        audioDurationSeconds: 164,
        writingTone: 'Warm Memoir',
        followUpQuestions: [
          'What was usually on the supper table when your grandmother rang the bell twice?',
          'Did you and Leo ever take the rowboat out past the point without telling anyone?',
        ],
        updatedAt: now,
      },
      {
        id: 'chap-02',
        order: 2,
        title: 'Flour on the Apron, Yeast in the Morning',
        subtitle: 'Saturday loaves in my grandmother’s kitchen',
        promptQuestion:
          'Describe someone who taught you a craft, recipe, or habit with their hands rather than a lecture.',
        epigraph:
          'She never owned a kitchen scale; she judged dough by how willingly it answered the heel of her palm.',
        pullQuote:
          'When you rush bread, she used to say, all you bake is impatience.',
        body: `Every Saturday morning from October through April, my grandmother’s kitchen was the warmest room in the county. Long before the rest of the house woke, she would light the pilot on the cast-iron range and set a chipped ceramic bowl beside the south window where the pale winter sun fell across the oak table.

She taught me to knead without ever giving a speech about measurements. Instead, she placed my small hands directly over hers so I could feel the rhythm: fold, press with the heel, quarter-turn, repeat. Flour drifted into the creases of my sleeves and settled on the bridge of my nose, while she hummed old radio waltzes under her breath.

Years later, when I opened my own small neighborhood bakery on Elm Street, I hung her flour-dusted calico apron beside the proofing rack. Even on mornings when thirty orders sat on the counter, pressing my palms into cool dough still brought her voice right back beside me.`,
        transcript:
          'Every Saturday morning in winter Grandma’s kitchen was the warmest room around. She never used a scale—she just put my hands on top of hers on the oak table so I’d feel how to fold, press, and turn the dough. Flour got everywhere. She used to say when you rush bread you just bake impatience. Later when I opened my Elm Street bakery I kept her apron by the rack.',
        audioUrl: null,
        audioDurationSeconds: 198,
        writingTone: 'Crisp Literary',
        followUpQuestions: [
          'What happened the very first time you baked a loaf completely on your own?',
          'Which customer at your Elm Street bakery reminded you most of her?',
        ],
        updatedAt: now,
      },
      {
        id: 'chap-03',
        order: 3,
        title: 'The Letter That Waited Six Months',
        subtitle: 'Choosing a different coast in the autumn of 1983',
        promptQuestion:
          'Tell the story of a crossroads moment—a decision that quietly changed the direction of your entire life.',
        epigraph:
          'Some doors do not slam shut; they simply stay propped open until you find the courage to step through.',
        pullQuote:
          'I kept the postmarked envelope in my coat pocket through three weeks of rain before opening it a second time.',
        body: `In October of 1983, I had a steady bookkeeping job in Portland, a reliable green Volvo with ninety thousand miles, and a growing suspicion that I was living someone else’s carefully drafted itinerary. On a Tuesday afternoon, a thick cream envelope arrived from a cousin in Monterey asking if I would help restore an old coastal inn’s ledger—and stay through the winter if the ocean suited me.

I told myself I needed a month to weigh the numbers. In truth, I knew the answer the evening I walked past the harbor and watched the fog roll under the bridge cables. Two weeks later I packed two suitcases, a box of family photographs, and my grandmother’s brass kettle into the Volvo and pointed the hood south along Highway 101.

That winter turned into twelve years, a marriage, and the life our children know today. Whenever Maya asks how you recognize a turning point while you are standing inside it, I tell her it rarely announces itself with trumpets—usually it arrives in a cream envelope on an ordinary Tuesday.`,
        transcript:
          'October 1983, I was doing bookkeeping in Portland, driving an old green Volvo. Then my cousin in Monterey wrote asking if I’d come down for the winter to help straighten out the books at a coastal inn. I kept the envelope in my coat pocket for weeks, then packed two suitcases, family photos, and Grandma’s kettle and drove south on 101. Stayed twelve years.',
        audioUrl: null,
        audioDurationSeconds: 142,
        writingTone: 'Warm Memoir',
        followUpQuestions: [
          'What was the very first sight you saw when you pulled into Monterey at the end of that drive?',
          'Who in Portland tried to talk you out of going, and what did you say to them?',
        ],
        updatedAt: now,
      },
    ],
    photos: [
      {
        id: 'photo-01',
        chapterId: 'chap-01',
        imageUrl: '/src/assets/images/sample_childhood_summer_1794804938197.jpg',
        caption: 'Figure 1.1 — Leo and Clara on the Cedar Cove dock, late August 1974.',
        storyNarrative:
          'Captured just before the seven o’clock supper bell, Leo and Clara sit shoulder-to-shoulder on the bleached barn-timber planks as the sunset turns the northern cove to copper. Clara’s braided pigtails and scuffed canvas sneakers still carry the dampness of an afternoon spent chasing minnows along the reeds.',
        memoryHint: 'My brother Leo and me sitting on Grandpa’s cedar dock at sunset around 1974.',
        yearLabel: 'August 1974',
        locationLabel: 'Cedar Cove, Northern Shore',
        placement: 'framed-figure',
        followUpQuestions: [
          'Who was standing behind the camera taking this picture on the shoreline?',
          'Do you remember what Leo was whispering to make you laugh right at that moment?',
        ],
        createdAt: now,
      },
      {
        id: 'photo-02',
        chapterId: 'chap-02',
        imageUrl: '/src/assets/images/sample_bakery_kitchen_1794804938875.jpg',
        caption: 'Figure 2.1 — Saturday morning sourdough by the south kitchen window.',
        storyNarrative:
          'Sunlight filters through the mullioned glass onto a well-worn oak tabletop dusted generously with stone-ground flour. With spectacles perched low and sleeves rolled past the elbow, Grandma guides small hands into the gentle rhythm of folding and resting the dough.',
        memoryHint: 'Baking Saturday bread with Grandma in her sunlit kitchen.',
        yearLabel: 'Spring 1976',
        locationLabel: 'Elm Hollow Farmhouse',
        placement: 'chapter-opener',
        followUpQuestions: [
          'What song did your grandmother usually hum while the bread rested under the linen towel?',
          'Do you still own that wooden spoon or ceramic mixing bowl today?',
        ],
        createdAt: now,
      },
    ],
    prompts: [
      {
        id: 'prompt-01',
        category: 'Childhood & Early Days',
        question:
          'What is a childhood place whose smells, light, or sounds you can still recall immediately?',
        memoryTriggers: [
          'Recall the season and time of day you usually arrived there.',
          'Name one small object you always carried in your pocket or hand.',
          'Think of the sound that signaled it was time to come inside.',
        ],
        coachingTip:
          'Start with one physical sense—the creak of a screen door, cedar heat, or gravel crunching—and let the scene unfold naturally.',
        estimatedMinutes: 4,
        isCustom: false,
        answeredChapterId: 'chap-01',
      },
      {
        id: 'prompt-02',
        category: 'Traditions & Table',
        question:
          'Describe someone who taught you a craft, recipe, or habit with their hands rather than a lecture.',
        memoryTriggers: [
          'Picture the workspace: table surface, tools, apron, or lighting.',
          'Remember a short phrase they repeated while working.',
          'Think about how that habit still shows up in your life today.',
        ],
        coachingTip:
          'Do not worry about listing exact ingredients or steps—focus on the rhythm between the two of you.',
        estimatedMinutes: 5,
        isCustom: false,
        answeredChapterId: 'chap-02',
      },
      {
        id: 'prompt-03',
        category: 'Turning Points',
        question:
          'Tell the story of a crossroads moment—a decision that quietly changed the direction of your entire life.',
        memoryTriggers: [
          'Remember what you were doing right before the opportunity or change arrived.',
          'Recall what you packed or left behind when you said yes.',
          'Think of one moment of doubt right before taking the leap.',
        ],
        coachingTip:
          'Speak as if explaining that season to a grandchild who only knows who you became afterward.',
        estimatedMinutes: 5,
        isCustom: false,
        answeredChapterId: 'chap-03',
      },
      {
        id: 'prompt-04',
        category: 'Family & Roots',
        question:
          'What did your parents or grandparents never say out loud, yet showed every single week through their actions?',
        memoryTriggers: [
          'Think about Sunday mornings, paydays, or how guests were welcomed at the door.',
          'Recall a quiet repair, saved envelope, or gesture of care you noticed only years later.',
        ],
        coachingTip:
          'Focus on one concrete Tuesday or Saturday memory rather than trying to summarize their whole personality.',
        estimatedMinutes: 4,
        isCustom: false,
        answeredChapterId: null,
      },
      {
        id: 'prompt-05',
        category: 'Love & Companionship',
        question:
          'Tell the story of an ordinary day with someone you love that captures your bond better than any anniversary.',
        memoryTriggers: [
          'Think of a long drive, a rainy errand, or fixing dinner when plans fell through.',
          'Recall a shared joke or small ritual nobody else would understand.',
        ],
        coachingTip:
          'Ordinary days carry the truest dialogue—include the small disagreements or laughter you remember.',
        estimatedMinutes: 4,
        isCustom: false,
        answeredChapterId: null,
      },
      {
        id: 'prompt-06',
        category: 'Craft, Work & Calling',
        question:
          'What was the hardest season of your work life, and who stood beside you while you figured it out?',
        memoryTriggers: [
          'Remember the earliest morning you ever woke up for that job or venture.',
          'Recall the first paycheck, first customer, or first mistake you survived.',
        ],
        coachingTip:
          'Tell the messy middle honestly—readers connect deepest with how resilience felt before the outcome was clear.',
        estimatedMinutes: 5,
        isCustom: false,
        answeredChapterId: null,
      },
      {
        id: 'prompt-07',
        category: 'Wisdom & Legacy',
        question:
          'If your family opens this book thirty years from now, what hard-earned lesson do you hope they remember first?',
        memoryTriggers: [
          'Think of advice you wish someone had given you at twenty-five.',
          'Pair the lesson with a real story so it feels lived-in, not preached.',
        ],
        coachingTip:
          'Speak directly to them—addressing your kids or grandchildren by name brings warmth right onto the page.',
        estimatedMinutes: 4,
        isCustom: false,
        answeredChapterId: null,
      },
    ],
  };
}

function loadDb(): BookWorkspaceData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw) as BookWorkspaceData;
    }
  } catch (err) {
    console.error('Failed to read database, re-seeding:', err);
  }
  const seeded = buildSeedWorkspace();
  saveDb(seeded);
  return seeded;
}

function saveDb(data: BookWorkspaceData): void {
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

function saveBase64Media(base64Data: string, mimeType: string, prefix: string): string {
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const baseMime = mimeType.split(';')[0].trim().toLowerCase();
  const ext = extMap[baseMime] || (baseMime.startsWith('audio/') ? 'webm' : 'jpg');
  const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, Buffer.from(cleanBase64, 'base64'));
  return `/uploads/${filename}`;
}

function extractBase64(dataUrlOrBase64: string): string {
  return dataUrlOrBase64.includes(',') ? dataUrlOrBase64.split(',')[1] : dataUrlOrBase64;
}

function cleanMimeType(mimeType: string, fallback: string): string {
  if (!mimeType) return fallback;
  const base = mimeType.split(';')[0].trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    'audio/x-m4a': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
    'audio/x-wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    'audio/mp3': 'audio/mpeg',
    'video/webm': 'audio/webm',
    'video/mp4': 'audio/mp4',
    'image/jpg': 'image/jpeg',
  };
  return aliasMap[base] || base;
}

function safeParseModelJson<T>(rawText: string | undefined, fallback: T): T {
  const cleaned = (rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!cleaned) return fallback;
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('AI response could not be parsed as structured JSON. Please try again.');
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Workspace Data Routes ---
  app.get('/api/book', (_req, res) => {
    const db = loadDb();
    db.chapters.sort((a, b) => a.order - b.order);
    res.json(db);
  });

  app.put('/api/book/settings', (req, res) => {
    const db = loadDb();
    db.settings = { ...db.settings, ...req.body };
    saveDb(db);
    res.json(db.settings);
  });

  app.post('/api/chapters', (req, res) => {
    const db = loadDb();
    const {
      title,
      subtitle = '',
      promptQuestion = '',
      epigraph = '',
      pullQuote = '',
      body = '',
      transcript = '',
      audioUrl = null,
      audioDurationSeconds = 0,
      writingTone = 'Warm Memoir',
      followUpQuestions = [],
      promptId,
    } = req.body as Partial<Chapter> & { promptId?: string };

    const nextOrder =
      db.chapters.length > 0 ? Math.max(...db.chapters.map((c) => c.order)) + 1 : 1;

    const newChapter: Chapter = {
      id: `chap-${crypto.randomUUID().slice(0, 8)}`,
      order: nextOrder,
      title: title || `Untitled Memory ${nextOrder}`,
      subtitle,
      promptQuestion,
      epigraph,
      pullQuote,
      body,
      transcript,
      audioUrl,
      audioDurationSeconds,
      writingTone: writingTone as WritingTone,
      followUpQuestions,
      updatedAt: new Date().toISOString(),
    };

    db.chapters.push(newChapter);
    if (promptId) {
      const prompt = db.prompts.find((p) => p.id === promptId);
      if (prompt) {
        prompt.answeredChapterId = newChapter.id;
      }
    }
    saveDb(db);
    res.status(201).json(newChapter);
  });

  app.put('/api/chapters/:id', (req, res) => {
    const db = loadDb();
    const idx = db.chapters.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Chapter not found.' });
      return;
    }
    db.chapters[idx] = {
      ...db.chapters[idx],
      ...req.body,
      id: db.chapters[idx].id,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    res.json(db.chapters[idx]);
  });

  app.delete('/api/chapters/:id', (req, res) => {
    const db = loadDb();
    db.chapters = db.chapters.filter((c) => c.id !== req.params.id);
    db.chapters.forEach((c, idx) => {
      c.order = idx + 1;
    });
    db.photos.forEach((p) => {
      if (p.chapterId === req.params.id) {
        p.chapterId = null;
      }
    });
    db.prompts.forEach((p) => {
      if (p.answeredChapterId === req.params.id) {
        p.answeredChapterId = null;
      }
    });
    saveDb(db);
    res.json({ ok: true, chapters: db.chapters });
  });

  app.post('/api/chapters/reorder', (req, res) => {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array is required.' });
      return;
    }
    const db = loadDb();
    const map = new Map(db.chapters.map((c) => [c.id, c]));
    const reordered: Chapter[] = [];
    orderedIds.forEach((id, index) => {
      const chap = map.get(id);
      if (chap) {
        chap.order = index + 1;
        reordered.push(chap);
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      remaining.order = reordered.length + 1;
      reordered.push(remaining);
    }
    db.chapters = reordered;
    saveDb(db);
    res.json(db.chapters);
  });

  // --- Photo Memories Routes ---
  app.post('/api/photos', (req, res) => {
    const db = loadDb();
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      imageUrl: providedUrl,
      chapterId = null,
      caption = '',
      storyNarrative = '',
      memoryHint = '',
      yearLabel = '',
      locationLabel = '',
      placement = 'framed-figure',
      followUpQuestions = [],
    } = req.body as Partial<MemoryPhoto> & { imageBase64?: string; mimeType?: string };

    let finalUrl = providedUrl || '';
    if (imageBase64) {
      finalUrl = saveBase64Media(imageBase64, mimeType, 'photo');
    }
    if (!finalUrl) {
      res.status(400).json({ error: 'An image file or URL is required.' });
      return;
    }

    const newPhoto: MemoryPhoto = {
      id: `photo-${crypto.randomUUID().slice(0, 8)}`,
      chapterId,
      imageUrl: finalUrl,
      caption,
      storyNarrative,
      memoryHint,
      yearLabel,
      locationLabel,
      placement,
      followUpQuestions,
      createdAt: new Date().toISOString(),
    };
    db.photos.unshift(newPhoto);
    saveDb(db);
    res.status(201).json(newPhoto);
  });

  app.put('/api/photos/:id', (req, res) => {
    const db = loadDb();
    const idx = db.photos.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Photo not found.' });
      return;
    }
    db.photos[idx] = { ...db.photos[idx], ...req.body, id: db.photos[idx].id };
    saveDb(db);
    res.json(db.photos[idx]);
  });

  app.delete('/api/photos/:id', (req, res) => {
    const db = loadDb();
    db.photos = db.photos.filter((p) => p.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // --- Guided Prompts Routes ---
  app.post('/api/prompts/custom', (req, res) => {
    const {
      category = 'Childhood & Early Days',
      question,
      memoryTriggers = [],
      coachingTip = 'Speak naturally about one concrete scene, smell, or conversation you still remember.',
      estimatedMinutes = 4,
    } = req.body as Partial<GuidedPrompt>;

    if (!question?.trim()) {
      res.status(400).json({ error: 'Question text is required.' });
      return;
    }

    const db = loadDb();
    const prompt: GuidedPrompt = {
      id: `prompt-${crypto.randomUUID().slice(0, 8)}`,
      category: category as PromptCategory,
      question: question.trim(),
      memoryTriggers:
        memoryTriggers.length > 0
          ? memoryTriggers
          : [
              'Close your eyes and place yourself in the room or street where this happened.',
              'Start with the people present and what time of day it was.',
            ],
      coachingTip,
      estimatedMinutes,
      isCustom: true,
      answeredChapterId: null,
    };
    db.prompts.unshift(prompt);
    saveDb(db);
    res.status(201).json(prompt);
  });

  // --- AI Routes (Server-Side @google/genai) ---
  app.post('/api/ai/transcribe-and-draft', async (req, res) => {
    try {
      const {
        audioBase64,
        mimeType = 'audio/webm',
        transcriptOverride,
        promptQuestion = '',
        storytellerName = 'the storyteller',
        writingTone = 'Warm Memoir',
        memoryNotes = '',
      } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        transcriptOverride?: string;
        promptQuestion?: string;
        storytellerName?: string;
        writingTone?: WritingTone;
        memoryNotes?: string;
      };

      const ai = getAiClient();
      let transcriptText = (transcriptOverride || '').trim();
      let savedAudioUrl: string | null = null;

      if (audioBase64) {
        const cleanedMime = cleanMimeType(mimeType, 'audio/webm');
        const rawBase64 = extractBase64(audioBase64);
        savedAudioUrl = saveBase64Media(rawBase64, cleanedMime, 'interview');

        const transcribeResp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanedMime,
                  data: rawBase64,
                },
              },
              {
                text: 'Transcribe this spoken personal memory interview accurately into clean, readable prose paragraphs. Preserve the speaker’s authentic phrasing, names, and emotional cadence while cleaning up false starts or filler um/uh sounds. Output only the verbatim transcript text.',
              },
            ],
          },
        });

        transcriptText = (transcribeResp.text || '').trim();
        if (!transcriptText) {
          throw new Error(
            'Audio transcription returned empty text. Please check microphone audio or speak clearly and try again.'
          );
        }
      }

      if (!transcriptText) {
        res.status(400).json({ error: 'Provide either recorded/uploaded audio or spoken notes.' });
        return;
      }

      const toneInstructions: Record<WritingTone, string> = {
        'Warm Memoir':
          'Write in an intimate, heartfelt first-person memoir voice with vivid sensory grounding and gentle warmth, ready for a family heirloom hardcover book.',
        'Preserve Spoken Voice':
          'Stay very close to the speaker’s original conversational phrasing, idioms, and rhythm while polishing paragraph structure and readability.',
        'Crisp Literary':
          'Elevate the prose into restrained, luminous literary non-fiction with strong opening imagery and resonant closing sentences.',
        'Legacy Biography':
          'Shape the account with clear historical dates, family context, and enduring life lessons suitable for future generations.',
      };

      const draftResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Transform the following interview transcript into a polished book manuscript chapter.

Storyteller: ${storytellerName}
Guided Prompt Question: ${promptQuestion || 'Open personal memory'}
Additional Context Notes: ${memoryNotes || 'None'}
Desired Editorial Tone (${writingTone}): ${toneInstructions[writingTone] || toneInstructions['Warm Memoir']}

Interview Transcript:
"""
${transcriptText}
"""

Requirements:
1. Do not invent facts, people, or dates that contradict the transcript; faithfully expand the storytelling flow and transitions.
2. Write 3 to 5 richly paced paragraphs for the chapter body (separated by blank lines).
3. Provide a compelling chapter title, a concise era/setting subtitle, a short 1-sentence epigraph, a memorable pullQuote from the chapter, and 2 thoughtful follow-up interview questions to help the storyteller unlock even deeper memories if they record a Part 2.`,
        config: {
          systemInstruction:
            'You are a senior memoir book editor at Remember Press, crafting deeply human, heirloom-quality book chapters from spoken interviews.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Evocative literary chapter title.' },
              subtitle: {
                type: Type.STRING,
                description: 'Short place/year/theme subtitle under the title.',
              },
              epigraph: {
                type: Type.STRING,
                description: 'A reflective 1-sentence opening line for the chapter.',
              },
              pullQuote: {
                type: Type.STRING,
                description: 'One standout line from the story for typographic callout.',
              },
              body: {
                type: Type.STRING,
                description: 'Full multi-paragraph manuscript chapter separated by double newlines.',
              },
              followUpQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Two gentle follow-up questions to help remember further details.',
              },
            },
            required: ['title', 'subtitle', 'epigraph', 'pullQuote', 'body', 'followUpQuestions'],
          },
        },
      });

      const parsed = safeParseModelJson<{
        title: string;
        subtitle: string;
        epigraph: string;
        pullQuote: string;
        body: string;
        followUpQuestions: string[];
      }>(draftResp.text, {
        title: 'Untitled Memory',
        subtitle: '',
        epigraph: '',
        pullQuote: '',
        body: transcriptText,
        followUpQuestions: [],
      });

      res.json({
        transcript: transcriptText,
        chapter: parsed,
        audioUrl: savedAudioUrl,
      });
    } catch (error) {
      console.error('transcribe-and-draft error:', error);
      res.status(500).json({
        error: formatApiError(error, 'Failed to transcribe and draft chapter.'),
      });
    }
  });

  app.post('/api/ai/refine-chapter', async (req, res) => {
    try {
      const { title, body, transcript, instruction } = req.body as {
        title: string;
        body: string;
        transcript?: string;
        instruction: string;
      };
      if (!body || !instruction) {
        res.status(400).json({ error: 'Chapter body and refinement instruction are required.' });
        return;
      }

      const ai = getAiClient();
      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Refine the following memoir chapter manuscript according to the author's instruction. Keep all factual memories truthful to the source material.

Chapter Title: ${title}
Author Instruction: ${instruction}

Current Manuscript Body:
"""
${body}
"""

Original Spoken Transcript (for factual grounding):
"""
${transcript || 'Not provided'}
"""`,
        config: {
          systemInstruction:
            'You are a skilled literary memoir editor. Return JSON with the updated chapter title, subtitle, pullQuote, and refined multi-paragraph body.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              pullQuote: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['title', 'pullQuote', 'body'],
          },
        },
      });

      res.json(safeParseModelJson(resp.text, { title, pullQuote: '', body }));
    } catch (error) {
      console.error('refine-chapter error:', error);
      res.status(500).json({
        error: formatApiError(error, 'Failed to refine chapter.'),
      });
    }
  });

  app.post('/api/ai/describe-photo', async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        memoryHint = '',
        chapterContext = '',
      } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        memoryHint?: string;
        chapterContext?: string;
      };

      if (!imageBase64) {
        res.status(400).json({ error: 'Image data is required to generate a photo story.' });
        return;
      }

      const ai = getAiClient();
      const cleanedMime = cleanMimeType(mimeType, 'image/jpeg');
      const rawBase64 = extractBase64(imageBase64);

      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanedMime,
                data: rawBase64,
              },
            },
            {
              text: `Look closely at this archival or family photograph and weave a warm, truthful memoir story around it.

User's Memory Note: ${memoryHint || 'No written hint yet—describe the visible moment warmly and respectfully.'}
Book Chapter Context: ${chapterContext || 'General family memoir'}

Return:
- caption: A crisp editorial figure caption (1 sentence, suitable under a printed book photograph).
- storyNarrative: A 2-paragraph evocative narrative describing the scene, clothing, lighting, expressions, and emotional context informed by the user's memory note (never fabricate specific names or dates that aren't in the memory note).
- yearLabel: Estimated era or user-supplied year/season label (e.g., "Summer 1974" or "Circa late 1970s").
- memoryQuestions: 3 specific, sensory follow-up questions pointing to real visual details in the photograph to help the storyteller remember more.`,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are a memoir visual curator at Remember Press. Observe photographic details carefully—light, posture, setting, era clues—and turn them into evocative book storytelling.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              storyNarrative: { type: Type.STRING },
              yearLabel: { type: Type.STRING },
              memoryQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['caption', 'storyNarrative', 'yearLabel', 'memoryQuestions'],
          },
        },
      });

      res.json(
        safeParseModelJson(resp.text, {
          caption: memoryHint || 'Family photograph',
          storyNarrative: '',
          yearLabel: '',
          memoryQuestions: [],
        })
      );
    } catch (error) {
      console.error('describe-photo error:', error);
      res.status(500).json({
        error: formatApiError(error, 'Failed to describe photo.'),
      });
    }
  });

  app.post('/api/ai/guided-prompts', async (req, res) => {
    try {
      const { category, lifeContext = '', existingTitles = [] } = req.body as {
        category: string;
        lifeContext?: string;
        existingTitles?: string[];
      };

      const ai = getAiClient();
      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate 3 deeply thoughtful, non-generic memoir interview questions for the category "${category}".

Storyteller Background / Context: ${lifeContext || 'Everyday family life, friendships, work, and traditions'}
Chapters already written: ${existingTitles.length > 0 ? existingTitles.join('; ') : 'None yet'}

For each question, also include:
- memoryTriggers: 3 short sensory recall cues (smells, objects, sounds, routines) that help people unlock forgotten memories before hitting record.
- coachingTip: 1 practical, warm instruction for speaking naturally during the audio interview.
- estimatedMinutes: integer between 3 and 6.`,
        config: {
          systemInstruction:
            'You are an oral historian and memoir interviewer trained in Storyworth-style reflective questioning. Ask specific, story-sparking questions rather than vague clichés.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    memoryTriggers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    coachingTip: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                  },
                  required: ['question', 'memoryTriggers', 'coachingTip', 'estimatedMinutes'],
                },
              },
            },
            required: ['prompts'],
          },
        },
      });

      const result = safeParseModelJson<{
        prompts: Array<{
          question: string;
          memoryTriggers: string[];
          coachingTip: string;
          estimatedMinutes: number;
        }>;
      }>(resp.text, { prompts: [] });

      const db = loadDb();
      const created: GuidedPrompt[] = result.prompts.map((item) => ({
        id: `prompt-${crypto.randomUUID().slice(0, 8)}`,
        category: category as PromptCategory,
        question: item.question,
        memoryTriggers: item.memoryTriggers,
        coachingTip: item.coachingTip,
        estimatedMinutes: item.estimatedMinutes || 4,
        isCustom: false,
        answeredChapterId: null,
      }));
      db.prompts = [...created, ...db.prompts];
      saveDb(db);

      res.json({ prompts: created });
    } catch (error) {
      console.error('guided-prompts error:', error);
      res.status(500).json({
        error: formatApiError(error, 'Failed to generate guided prompts.'),
      });
    }
  });

  app.post('/api/ai/narrate-chapter', async (req, res) => {
    try {
      const { title, body } = req.body as { title: string; body: string };
      if (!body?.trim()) {
        res.status(400).json({ error: 'Chapter text is required for narration.' });
        return;
      }

      const ai = getAiClient();
      const excerpt = `${title ? `${title}. ` : ''}${body}`.slice(0, 1800);
      const ttsResp = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: excerpt,
                speechMetadata: {
                  style: 'Warm, unhurried audiobook narrator reading a personal family memoir',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio =
        ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Narration audio was not returned.');
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (error) {
      console.error('narrate-chapter error:', error);
      res.status(500).json({
        error: formatApiError(error, 'Failed to narrate chapter.'),
      });
    }
  });

  // Ensure API errors always return JSON rather than HTML error pages
  app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled /api error:', err);
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status?: number }).status === 'number'
        ? (err as { status: number }).status
        : 500;
    res.status(status).json({
      error: formatApiError(err, 'Unexpected server error while handling request.'),
    });
  });

  // --- Vite / Static Frontend Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Remember Press server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { Buffer } from 'buffer';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import Database from 'better-sqlite3';

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize API clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hume API configuration
const HUME_API_KEY = process.env.HUME_API_KEY;
const HUME_API_URL = 'https://api.hume.ai/v0/batch/jobs';

// Function to analyze emotional prosody using Hume API
async function analyzeEmotionalProsody(audioFilePath) {
  if (!HUME_API_KEY) {
    console.log('Hume API key not configured, skipping prosody analysis');
    return null;
  }

  try {
    console.log('Starting Hume prosody analysis...');

    // Read audio file as base64
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBase64 = audioBuffer.toString('base64');

    // Create a batch job request for prosody analysis
    const requestBody = {
      models: {
        prosody: {}
      },
      urls: [],
      files: [
        {
          filename: 'dream_recording.webm',
          content_type: 'audio/webm',
          data: audioBase64
        }
      ]
    };

    // Submit job to Hume API
    const submitResponse = await fetch(HUME_API_URL, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Hume API error:', submitResponse.status, errorText);
      return null;
    }

    const jobInfo = await submitResponse.json();
    const jobId = jobInfo.job_id;
    console.log('Hume job submitted:', jobId);

    // Poll for job completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 2000; // 2 seconds
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsed += pollInterval;

      const statusResponse = await fetch(`${HUME_API_URL}/${jobId}`, {
        headers: {
          'X-Hume-Api-Key': HUME_API_KEY
        }
      });

      if (!statusResponse.ok) {
        console.error('Failed to check Hume job status');
        return null;
      }

      const statusData = await statusResponse.json();

      if (statusData.state.status === 'COMPLETED') {
        console.log('Hume analysis complete');

        // Get predictions
        const predictionsResponse = await fetch(`${HUME_API_URL}/${jobId}/predictions`, {
          headers: {
            'X-Hume-Api-Key': HUME_API_KEY
          }
        });

        if (!predictionsResponse.ok) {
          console.error('Failed to fetch Hume predictions');
          return null;
        }

        const predictions = await predictionsResponse.json();
        return extractProsodyInsights(predictions);
      } else if (statusData.state.status === 'FAILED') {
        console.error('Hume job failed:', statusData.state.message);
        return null;
      }

      console.log('Hume job status:', statusData.state.status, '- waiting...');
    }

    console.log('Hume analysis timed out');
    return null;

  } catch (error) {
    console.error('Prosody analysis error:', error.message);
    return null;
  }
}

// Generate dream image using DALL-E
async function generateDreamImage(analysis) {
  try {
    console.log('Generating dream image with DALL-E...');

    // Create a prompt from the dream analysis
    const dreamTitle = analysis.overview?.title || 'A dream';
    const dreamSummary = analysis.overview?.summary || '';
    const emotionalTone = analysis.overview?.emotionalTone || '';
    const settings = analysis.manifestContent?.settings?.map(s => s.location).join(', ') || '';

    // Craft a visual prompt based on the dream content
    const imagePrompt = `Create a dreamlike, surreal digital art image depicting: ${dreamTitle}. ${dreamSummary}
    The mood is ${emotionalTone}. Settings include: ${settings}.
    Style: ethereal, soft lighting, atmospheric, dreamlike quality, fantasy art, impressionistic elements,
    muted color palette with occasional vibrant accents. No text or letters in the image.`.slice(0, 1000);

    console.log('DALL-E prompt:', imagePrompt.substring(0, 100) + '...');

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    });

    const imageUrl = response.data[0]?.url;
    const revisedPrompt = response.data[0]?.revised_prompt;

    console.log('Dream image generated successfully');

    return {
      url: imageUrl,
      prompt: revisedPrompt || imagePrompt,
      status: 'generated'
    };

  } catch (error) {
    console.error('Dream image generation error:', error.message);
    return {
      url: null,
      prompt: 'Image generation failed',
      status: 'failed'
    };
  }
}

// Extract key emotional insights from Hume predictions
function extractProsodyInsights(predictions) {
  try {
    const prosodyPredictions = predictions?.[0]?.results?.predictions?.[0]?.models?.prosody?.grouped_predictions;

    if (!prosodyPredictions || prosodyPredictions.length === 0) {
      return {
        dominantEmotions: [],
        emotionalArc: 'Unable to determine',
        overallTone: 'Neutral',
        hesitationMarkers: []
      };
    }

    // Aggregate emotions across all predictions
    const emotionScores = {};
    const hesitationMarkers = [];

    prosodyPredictions.forEach((group, index) => {
      group.predictions?.forEach(pred => {
        pred.emotions?.forEach(emotion => {
          if (!emotionScores[emotion.name]) {
            emotionScores[emotion.name] = [];
          }
          emotionScores[emotion.name].push(emotion.score);

          // Track hesitation indicators (low confidence, uncertainty)
          if (['Confusion', 'Doubt', 'Anxiety'].includes(emotion.name) && emotion.score > 0.3) {
            hesitationMarkers.push({
              time: pred.time?.begin || index,
              emotion: emotion.name,
              intensity: emotion.score
            });
          }
        });
      });
    });

    // Calculate average scores and find dominant emotions
    const avgScores = Object.entries(emotionScores).map(([name, scores]) => ({
      name,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    })).sort((a, b) => b.avgScore - a.avgScore);

    const dominantEmotions = avgScores.slice(0, 5).map(e => ({
      emotion: e.name,
      intensity: Math.round(e.avgScore * 100) / 100
    }));

    // Determine overall emotional tone
    const positiveEmotions = ['Joy', 'Interest', 'Amusement', 'Excitement', 'Love'];
    const negativeEmotions = ['Sadness', 'Anger', 'Fear', 'Disgust', 'Anxiety'];

    let posScore = 0, negScore = 0;
    dominantEmotions.forEach(e => {
      if (positiveEmotions.includes(e.emotion)) posScore += e.intensity;
      if (negativeEmotions.includes(e.emotion)) negScore += e.intensity;
    });

    let overallTone = 'Neutral';
    if (posScore > negScore + 0.2) overallTone = 'Positive';
    else if (negScore > posScore + 0.2) overallTone = 'Negative';
    else if (posScore > 0.3 && negScore > 0.3) overallTone = 'Mixed';

    // Determine emotional arc (beginning vs end)
    const firstHalf = prosodyPredictions.slice(0, Math.floor(prosodyPredictions.length / 2));
    const secondHalf = prosodyPredictions.slice(Math.floor(prosodyPredictions.length / 2));

    let emotionalArc = 'Stable';
    // Simplified arc detection based on emotion intensity changes

    return {
      dominantEmotions,
      emotionalArc,
      overallTone,
      hesitationMarkers: hesitationMarkers.slice(0, 5) // Limit to 5 markers
    };

  } catch (error) {
    console.error('Error extracting prosody insights:', error);
    return {
      dominantEmotions: [],
      emotionalArc: 'Unable to determine',
      overallTone: 'Neutral',
      hesitationMarkers: []
    };
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}.webm`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Clerk authentication middleware (makes auth available on all routes)
// Map VITE_CLERK_PUBLISHABLE_KEY to the expected CLERK_PUBLISHABLE_KEY
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

app.use(clerkMiddleware({
  publishableKey: clerkPublishableKey,
  secretKey: clerkSecretKey
}));

// Custom authentication middleware that returns 401 for unauthenticated requests
const requireAuthentication = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in to access this resource.'
    });
  }
  req.userId = auth.userId;
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SQLite DATABASE SETUP
// ============================================
const dbPath = join(__dirname, 'dreams.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS dreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    title TEXT,
    transcript TEXT,
    wordCount INTEGER,
    recordingDuration INTEGER,
    emotionalTone TEXT,
    dreamType TEXT,
    dreamTypeConfidence REAL,
    analysis TEXT,
    prosody TEXT,
    dreamImage TEXT,
    isArchived INTEGER DEFAULT 0,
    isPrivate INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index for userId queries
db.exec(`CREATE INDEX IF NOT EXISTS idx_dreams_userId ON dreams(userId)`);

console.log('SQLite database initialized at:', dbPath);

// Helper function to check dream ownership
const checkDreamOwnership = (dreamId, userId) => {
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);
  if (!dream) {
    return { exists: false, owned: false };
  }
  return { exists: true, owned: dream.userId === userId, dream: dream };
};

// Helper to serialize JSON fields
const serializeDream = (dream) => ({
  ...dream,
  analysis: dream.analysis ? JSON.parse(dream.analysis) : null,
  prosody: dream.prosody ? JSON.parse(dream.prosody) : null,
  dreamImage: dream.dreamImage ? JSON.parse(dream.dreamImage) : null,
  isArchived: Boolean(dream.isArchived),
  isPrivate: Boolean(dream.isPrivate),
});

// ============================================
// TEST ENDPOINTS (Development only - for verifying security and persistence)
// ============================================

// Test endpoint to simulate dream isolation scenario (using SQLite)
// This endpoint is only for testing purposes and should be disabled in production
app.post('/api/test/dream-isolation', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Simulate creating a dream owned by "user_A"
  const userAId = 'test_user_A';
  const userBId = 'test_user_B';

  // Create a dream for User A in SQLite
  const stmt = db.prepare(`
    INSERT INTO dreams (userId, title, transcript, createdAt, updatedAt)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `);
  const result = stmt.run(userAId, 'User A Secret Dream', 'This dream belongs to User A and should not be visible to User B');
  const dreamId = result.lastInsertRowid;

  // Test 1: User A can access their own dream
  const userAAccess = checkDreamOwnership(dreamId, userAId);

  // Test 2: User B cannot access User A's dream
  const userBAccess = checkDreamOwnership(dreamId, userBId);

  // Clean up test dream
  db.prepare('DELETE FROM dreams WHERE id = ?').run(dreamId);

  res.json({
    testResults: {
      dreamCreated: true,
      dreamId: String(dreamId),
      userACanAccess: userAAccess.exists && userAAccess.owned,
      userBCanAccess: userBAccess.exists && userBAccess.owned,
      isolationWorking: userAAccess.owned && !userBAccess.owned
    },
    message: userAAccess.owned && !userBAccess.owned
      ? 'Dream isolation is working correctly - User B cannot access User A\'s dream'
      : 'ERROR: Dream isolation is NOT working!'
  });
});

// Test endpoint to verify SQLite persistence
// This endpoint is only for testing purposes and should be disabled in production
app.post('/api/test/persistence', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const testUserId = 'test_persistence_user';
  const uniquePhrase = req.body.phrase || 'TEST_UNIQUE_' + Date.now();

  // Step 1: Create a dream with the unique phrase
  const insertStmt = db.prepare(`
    INSERT INTO dreams (userId, title, transcript, emotionalTone, dreamType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const insertResult = insertStmt.run(
    testUserId,
    'Test Dream: ' + uniquePhrase,
    'Dream transcript containing ' + uniquePhrase,
    'Positive',
    'Resolution'
  );
  const dreamId = insertResult.lastInsertRowid;

  // Step 2: Verify the dream can be retrieved
  const dream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);

  // Step 3: Verify the unique phrase is in the dream
  const phraseFound = dream && (
    dream.title.includes(uniquePhrase) ||
    (dream.transcript && dream.transcript.includes(uniquePhrase))
  );

  // Step 4: Verify we can list user's dreams
  const userDreams = db.prepare('SELECT * FROM dreams WHERE userId = ?').all(testUserId);
  const dreamInList = userDreams.some(d => d.id === dreamId);

  // Clean up: delete the test dream
  db.prepare('DELETE FROM dreams WHERE id = ?').run(dreamId);

  // Verify it was deleted
  const deletedDream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);

  res.json({
    testResults: {
      dreamCreated: !!dream,
      dreamId: String(dreamId),
      uniquePhraseFound: phraseFound,
      dreamInUserList: dreamInList,
      totalUserDreamsFound: userDreams.length,
      dreamDeleted: !deletedDream,
      persistenceWorking: !!dream && phraseFound && dreamInList && !deletedDream
    },
    dream: dream ? serializeDream(dream) : null,
    message: !!dream && phraseFound && dreamInList && !deletedDream
      ? 'SQLite persistence is working correctly!'
      : 'ERROR: Persistence test failed!'
  });
});

// Test endpoint to create a persistent dream (without cleanup) for restart testing
app.post('/api/test/create-persistent-dream', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const testUserId = 'persist_test_user';
  const uniquePhrase = req.body.phrase || 'PERSIST_' + Date.now();

  // Create a dream that won't be deleted
  const insertStmt = db.prepare(`
    INSERT INTO dreams (userId, title, transcript, emotionalTone, dreamType, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const insertResult = insertStmt.run(
    testUserId,
    'Persistent Dream: ' + uniquePhrase,
    'This dream should survive server restarts. Unique phrase: ' + uniquePhrase,
    'Positive',
    'Generative'
  );
  const dreamId = insertResult.lastInsertRowid;

  res.json({
    success: true,
    dreamId: String(dreamId),
    userId: testUserId,
    uniquePhrase,
    message: 'Dream created and will persist across server restarts'
  });
});

// Test endpoint to check if persistent dreams still exist after restart
app.get('/api/test/check-persistent-dreams', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const testUserId = 'persist_test_user';
  const dreams = db.prepare('SELECT * FROM dreams WHERE userId = ?').all(testUserId);

  res.json({
    success: true,
    count: dreams.length,
    dreams: dreams.map(d => serializeDream(d)),
    message: dreams.length > 0
      ? `Found ${dreams.length} persistent dream(s)!`
      : 'No persistent dreams found'
  });
});

// Test endpoint to clean up persistent test dreams
app.delete('/api/test/cleanup-persistent-dreams', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const testUserId = 'persist_test_user';
  const result = db.prepare('DELETE FROM dreams WHERE userId = ?').run(testUserId);

  res.json({
    success: true,
    deletedCount: result.changes,
    message: `Deleted ${result.changes} persistent test dream(s)`
  });
});

// Test endpoint to create a dream for ANY user (for testing UI persistence)
// This bypasses audio recording requirement for testing
app.post('/api/test/create-dream-for-user', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const { userId, phrase } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const uniquePhrase = phrase || 'TEST_UNIQUE_' + Date.now();

  // Create a complete analysis object for realistic testing
  const mockAnalysis = {
    overview: {
      title: 'Test Dream: ' + uniquePhrase,
      emotionalTone: 'Positive with undertones of wonder',
      dreamType: 'Generative',
      dreamTypeConfidence: 0.85,
      summary: 'A test dream containing the unique phrase: ' + uniquePhrase
    },
    manifestContent: {
      characters: [{ name: 'The Dreamer', role: 'Protagonist', familiarity: 'Self' }],
      settings: [{ location: 'A mystical testing environment', familiarity: 'Unfamiliar' }],
      actions: ['Testing persistence', 'Verifying database functionality'],
      emotions: [{ emotion: 'Curiosity', intensity: 4, context: 'Testing features' }],
      schredlScales: {
        dreamLength: { value: 50, label: 'Medium', interpretation: 'Moderate length' },
        realism: { value: 3, label: 'Moderately Realistic', interpretation: 'Some surreal elements' },
        emotionalIntensityPositive: { value: 3, label: 'Moderate', interpretation: 'Pleasant' },
        emotionalIntensityNegative: { value: 1, label: 'Low', interpretation: 'Minimal distress' },
        clarity: { value: 4, label: 'Clear', interpretation: 'Well-remembered' },
        selfParticipation: { value: 5, label: 'Active', interpretation: 'Fully engaged' },
        socialDensity: { value: 2, label: 'Low', interpretation: 'Few characters' },
        agency: { value: 4, label: 'High', interpretation: 'In control' },
        narrativeCoherence: { value: 4, label: 'Coherent', interpretation: 'Clear narrative' }
      }
    },
    cdtAnalysis: {
      vaultActivation: {
        assessment: 'Testing vault activation',
        recentMemories: ['Test implementation'],
        distantMemories: ['Past testing experiences'],
        interpretation: 'Memory test complete'
      },
      cognitiveDrift: {
        themes: [{ theme: 'Testing', confidence: 0.9 }],
        interpretation: 'Test-oriented drift'
      },
      convergenceIndicators: {
        present: true,
        evidence: 'Test evidence',
        resolutionType: 'Verification'
      },
      dreamTypeRationale: 'Generated for testing purposes'
    },
    archetypalResonances: {
      threshold: { present: true, elements: ['Test threshold'], reflection: 'Testing boundary' },
      shadow: { present: false, elements: [], reflection: null },
      animaAnimus: { present: false, elements: [], reflection: null },
      selfWholeness: { present: true, elements: ['Complete test'], reflection: 'Testing wholeness' },
      scenarios: [{ name: 'Testing Journey', description: 'A quest for verification' }]
    },
    reflectivePrompts: [
      { category: 'Exploration', prompt: 'What does this test reveal?', dreamConnection: 'Overall dream' }
    ]
  };

  // Create a dream with complete data
  const insertStmt = db.prepare(`
    INSERT INTO dreams (
      userId, title, transcript, wordCount, recordingDuration,
      emotionalTone, dreamType, dreamTypeConfidence,
      analysis, prosody, dreamImage, isArchived, isPrivate,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      datetime('now'), datetime('now')
    )
  `);

  const insertResult = insertStmt.run(
    userId,
    'Test Dream: ' + uniquePhrase,
    'This is a test dream transcript containing the unique phrase: ' + uniquePhrase + '. The dream involves testing database persistence and verifying that dreams survive server restarts.',
    25,
    30,
    'Positive with undertones of wonder',
    'Generative',
    0.85,
    JSON.stringify(mockAnalysis),
    null,
    JSON.stringify({ url: null, prompt: 'Test dream visualization', status: 'pending' }),
    0,
    0
  );

  const dreamId = insertResult.lastInsertRowid;

  res.json({
    success: true,
    dreamId: String(dreamId),
    userId,
    uniquePhrase,
    message: 'Dream created for user ' + userId + '. The dream will appear in their Dream Journal.'
  });
});

// Test endpoint to check if a dream exists by ID (for deletion verification)
app.get('/api/test/dream-exists/:id', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const dreamId = req.params.id;
  const dream = db.prepare('SELECT id, title, userId, createdAt, updatedAt FROM dreams WHERE id = ?').get(dreamId);

  res.json({
    exists: !!dream,
    dreamId,
    dream: dream ? {
      id: dream.id,
      title: dream.title,
      userId: dream.userId,
      createdAt: dream.createdAt,
      updatedAt: dream.updatedAt
    } : null
  });
});

// Test endpoint to delete a dream by ID (for testing deletion while viewing)
app.delete('/api/test/delete-dream/:id', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const dreamId = req.params.id;
  const result = db.prepare('DELETE FROM dreams WHERE id = ?').run(dreamId);

  res.json({
    success: result.changes > 0,
    dreamId,
    deleted: result.changes > 0,
    message: result.changes > 0
      ? `Dream ${dreamId} deleted successfully`
      : `Dream ${dreamId} not found`
  });
});

// Test endpoint to update dream title (for testing concurrent edits)
app.patch('/api/test/update-dream/:id', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const dreamId = req.params.id;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const result = db.prepare('UPDATE dreams SET title = ?, updatedAt = ? WHERE id = ?').run(title, now, dreamId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Dream not found' });
  }

  const updatedDream = db.prepare('SELECT id, title, updatedAt FROM dreams WHERE id = ?').get(dreamId);

  res.json({
    success: true,
    dreamId,
    title: updatedDream.title,
    updatedAt: updatedDream.updatedAt,
    message: `Dream ${dreamId} updated successfully`
  });
});

// ============================================
// PROTECTED DREAM ENDPOINTS (Require Authentication)
// ============================================

// GET /api/dreams - List user's dreams (requires authentication)
app.get('/api/dreams', requireAuthentication, (req, res) => {
  const userId = req.userId;

  console.log('GET /api/dreams - userId:', userId);

  // Get dreams from SQLite
  const rows = db.prepare('SELECT * FROM dreams WHERE userId = ? ORDER BY createdAt DESC').all(userId);
  const userDreams = rows.map(row => serializeDream(row));

  console.log('GET /api/dreams - found', userDreams.length, 'dreams for user', userId);

  res.json({
    dreams: userDreams,
    total: userDreams.length,
    message: 'Dream list retrieved successfully'
  });
});

// POST /api/dreams/upload - Upload dream audio (requires authentication)
app.post('/api/dreams/upload', requireAuthentication, upload.single('audio'), (req, res) => {
  const userId = req.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  // Insert into SQLite
  const stmt = db.prepare(`
    INSERT INTO dreams (userId, title, createdAt, updatedAt)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  const result = stmt.run(userId, 'New Dream Recording');
  const dreamId = result.lastInsertRowid;

  res.json({
    success: true,
    dreamId: String(dreamId),
    file: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    },
    message: 'Dream audio uploaded successfully'
  });
});

// GET /api/dreams/:id - Get single dream (requires authentication)
app.get('/api/dreams/:id', requireAuthentication, (req, res) => {
  const userId = req.userId;
  const dreamId = req.params.id;

  const ownership = checkDreamOwnership(dreamId, userId);

  // If dream doesn't exist, return 404
  if (!ownership.exists) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Dream not found'
    });
  }

  // If dream exists but belongs to another user, return 404 (security best practice)
  if (!ownership.owned) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Dream not found'
    });
  }

  // Return the dream data
  res.json({
    dream: serializeDream(ownership.dream),
    message: 'Dream retrieved successfully'
  });
});

// PATCH /api/dreams/:id - Update dream (requires authentication)
app.patch('/api/dreams/:id', requireAuthentication, (req, res) => {
  const userId = req.userId;
  const dreamId = req.params.id;

  const ownership = checkDreamOwnership(dreamId, userId);

  // If dream doesn't exist, return 404
  if (!ownership.exists) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Dream not found'
    });
  }

  // If dream exists but belongs to another user, return 403
  if (!ownership.owned) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to modify this dream'
    });
  }

  // Update the dream in SQLite
  const updates = req.body;
  const allowedFields = ['title', 'isArchived', 'isPrivate'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      // Convert booleans to integers for SQLite
      values.push(typeof updates[field] === 'boolean' ? (updates[field] ? 1 : 0) : updates[field]);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push("updatedAt = datetime('now')");
    values.push(dreamId);
    const sql = `UPDATE dreams SET ${setClauses.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
  }

  // Fetch updated dream
  const updatedDream = db.prepare('SELECT * FROM dreams WHERE id = ?').get(dreamId);

  res.json({
    success: true,
    dream: serializeDream(updatedDream),
    message: 'Dream updated successfully'
  });
});

// DELETE /api/dreams/:id - Delete dream (requires authentication)
app.delete('/api/dreams/:id', requireAuthentication, (req, res) => {
  const userId = req.userId;
  const dreamId = req.params.id;

  const ownership = checkDreamOwnership(dreamId, userId);

  // If dream doesn't exist, return 404
  if (!ownership.exists) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Dream not found'
    });
  }

  // If dream exists but belongs to another user, return 403
  if (!ownership.owned) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to delete this dream'
    });
  }

  // Delete the dream from SQLite
  db.prepare('DELETE FROM dreams WHERE id = ?').run(dreamId);

  res.json({
    success: true,
    message: 'Dream deleted successfully'
  });
});

// Transcription endpoint using Groq Whisper
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', req.file.path, 'Size:', req.file.size);

    // Read the file as a stream for Groq
    const audioFile = fs.createReadStream(req.file.path);

    // Call Groq Whisper API for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'en',
    });

    console.log('Transcription successful:', transcription.text?.substring(0, 100) + '...');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      transcript: transcription.text,
      wordCount: transcription.text.split(/\s+/).filter(w => w).length,
      success: true
    });

  } catch (error) {
    console.error('Transcription error:', error);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Transcription failed',
      details: error.message
    });
  }
});

// Dream analysis endpoint using OpenAI
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, duration } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    console.log('Analyzing dream transcript:', transcript.substring(0, 100) + '...');

    // Comprehensive CDT agent prompt for dream analysis
    const analysisPrompt = `You are a dream analyst trained in Cognitive Dream Theory (CDT), Schredl manifest content coding, and Jungian archetypal frameworks. Analyze the following dream transcript and provide a structured analysis.

DREAM TRANSCRIPT:
${transcript}

RECORDING DURATION: ${duration || 'Unknown'} seconds

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "overview": {
    "title": "A poetic 3-6 word title for this dream",
    "emotionalTone": "Brief description of overall emotional quality",
    "dreamType": "One of: Resolution, Replay, Residual, Generative, or Lucid",
    "dreamTypeConfidence": 0.0 to 1.0,
    "summary": "2-3 sentence summary of the dream's narrative"
  },
  "manifestContent": {
    "characters": [
      {"name": "character name", "role": "their role in dream", "familiarity": "Familiar/Unfamiliar/Self"}
    ],
    "settings": [
      {"location": "setting description", "familiarity": "Familiar/Unfamiliar/Hybrid"}
    ],
    "actions": ["list of key actions"],
    "emotions": [
      {"emotion": "emotion name", "intensity": 1-5, "context": "when this emotion appeared"}
    ],
    "schredlScales": {
      "dreamLength": {"value": word count, "label": "Short/Medium/Long", "interpretation": "brief explanation"},
      "realism": {"value": 1-5, "label": "Realistic to Bizarre", "interpretation": "explanation"},
      "emotionalIntensityPositive": {"value": 0-5, "label": "intensity label", "interpretation": "explanation"},
      "emotionalIntensityNegative": {"value": 0-5, "label": "intensity label", "interpretation": "explanation"},
      "clarity": {"value": 1-5, "label": "clarity label", "interpretation": "explanation"},
      "selfParticipation": {"value": 1-5, "label": "participation level", "interpretation": "explanation"},
      "socialDensity": {"value": 1-5, "label": "density label", "interpretation": "explanation"},
      "agency": {"value": 1-5, "label": "agency level", "interpretation": "explanation"},
      "narrativeCoherence": {"value": 1-5, "label": "coherence level", "interpretation": "explanation"}
    }
  },
  "cdtAnalysis": {
    "vaultActivation": {
      "assessment": "Overall assessment of memory activation",
      "recentMemories": ["list of recent memory indicators"],
      "distantMemories": ["list of distant memory indicators"],
      "interpretation": "What this pattern might suggest"
    },
    "cognitiveDrift": {
      "themes": [
        {"theme": "drift theme name", "confidence": 0.0 to 1.0}
      ],
      "interpretation": "What the drift patterns suggest"
    },
    "convergenceIndicators": {
      "present": true/false,
      "evidence": "Evidence for convergence or lack thereof",
      "resolutionType": "Type of resolution if present"
    },
    "dreamTypeRationale": "Explanation for the dream type classification"
  },
  "archetypalResonances": {
    "threshold": {
      "present": true/false,
      "elements": ["elements suggesting threshold"],
      "reflection": "What this might reflect"
    },
    "shadow": {
      "present": true/false,
      "elements": ["shadow elements if present"],
      "reflection": "What this might reflect"
    },
    "animaAnimus": {
      "present": true/false,
      "elements": ["anima/animus elements if present"],
      "reflection": "What this might reflect"
    },
    "selfWholeness": {
      "present": true/false,
      "elements": ["self/wholeness elements if present"],
      "reflection": "What this might reflect"
    },
    "scenarios": [
      {"name": "Archetypal scenario name", "description": "Brief description"}
    ]
  },
  "reflectivePrompts": [
    {
      "category": "Exploration/Emotional/Action-oriented/Integration",
      "prompt": "The reflective question",
      "dreamConnection": "Which part of the dream this relates to"
    }
  ]
}

Remember:
- Use non-prescriptive language ("may reflect", "could relate to", "might suggest")
- Keep the dreamer as the final authority on meaning
- Ground interpretations in CDT/Schredl/Jungian frameworks
- Be warm, insightful, and psychologically sophisticated`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a dream analyst. Respond only with valid JSON, no markdown code blocks.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content;
    console.log('Analysis response received, parsing JSON...');

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      let cleanedResponse = responseText;
      if (responseText.includes('```json')) {
        cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (responseText.includes('```')) {
        cleanedResponse = responseText.replace(/```\n?/g, '');
      }
      analysis = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({
        error: 'Failed to parse analysis response',
        details: parseError.message
      });
    }

    res.json({
      success: true,
      analysis,
      transcript,
      wordCount: transcript.split(/\s+/).filter(w => w).length,
      recordingDuration: duration
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message
    });
  }
});

// Combined transcribe and analyze endpoint
// Note: This endpoint optionally accepts auth but works without it for demo purposes
app.post('/api/process-dream', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get user ID if authenticated (optional - allows demo usage without auth)
    const auth = getAuth(req);
    const userId = auth?.userId || 'anonymous';

    const duration = req.body.duration || 0;
    console.log('Processing dream recording:', req.file.path, 'Duration:', duration, 'seconds', 'User:', userId);

    // Step 1: Transcribe with Groq Whisper
    console.log('Step 1: Transcribing audio...');
    const audioFile = fs.createReadStream(req.file.path);

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'en',
    });

    const transcript = transcription.text;
    console.log('Transcription complete:', transcript.substring(0, 100) + '...');

    // Step 2: Analyze emotional prosody with Hume API (in parallel)
    console.log('Step 2: Analyzing emotional prosody...');
    let prosodyAnalysis = null;
    try {
      prosodyAnalysis = await analyzeEmotionalProsody(req.file.path);
      console.log('Prosody analysis complete:', prosodyAnalysis ? 'Success' : 'No data');
    } catch (prosodyError) {
      console.error('Prosody analysis failed (non-blocking):', prosodyError.message);
    }

    // Clean up uploaded file after prosody analysis
    fs.unlinkSync(req.file.path);

    // Step 3: Analyze with OpenAI
    console.log('Step 3: Analyzing dream with CDT framework...');

    const wordCount = transcript.split(/\s+/).filter(w => w).length;

    const analysisPrompt = `You are a warm, insightful dream analyst trained in Cognitive Dream Theory (CDT), Schredl manifest content coding, and Jungian archetypal frameworks. Your role is not just to analyze, but to help the dreamer understand the psychological significance of their dream in an accessible, meaningful way.

DREAM TRANSCRIPT:
${transcript}

RECORDING DURATION: ${duration} seconds
WORD COUNT: ${wordCount}

Provide a comprehensive, narrative-style analysis in the following JSON format. Write as if you're a thoughtful guide explaining your interpretive process, not generating a clinical report.

Respond ONLY with valid JSON (no markdown code blocks):
{
  "overview": {
    "title": "A poetic 3-6 word title capturing the dream's essence",
    "emotionalTone": "2-3 word emotional quality (e.g., 'Calm and nostalgic', 'Anxious yet hopeful')",
    "dreamType": "One of: Resolution, Replay, Residual, Generative, or Lucid",
    "dreamTypeConfidence": 0.0 to 1.0,
    "summary": "2-3 sentence narrative summary of what happened in the dream",
    "synthesis": "A 2-3 paragraph insightful analysis (150-250 words) that weaves together findings from all analytical frameworks. This should feel like sitting with a thoughtful analyst who explains what stands out about this dream, how the emotional content connects to the imagery, what the dream might be processing psychologically, and what makes this dream personally meaningful. Avoid clinical language. Write warmly and accessibly while maintaining psychological depth. Reference specific images and moments from the dream.",
    "keyInsights": [
      "First key takeaway - a specific, actionable insight about what this dream reveals",
      "Second key takeaway - another meaningful observation connecting dream content to psychological themes",
      "Third key takeaway - a reflection point or pattern worth noticing"
    ]
  },
  "manifestContent": {
    "sectionContext": "The manifest content is what you actually experienced in the dream - the characters, places, and events. Analyzing these elements helps us understand what your mind chose to weave into this particular narrative.",
    "characters": [
      {"name": "character name", "role": "their role/relationship in dream", "familiarity": "Familiar/Unfamiliar/Self", "significance": "Brief note on why this person may have appeared"}
    ],
    "settings": [
      {"location": "setting description", "familiarity": "Familiar/Unfamiliar/Hybrid", "atmosphere": "The emotional quality of this space"}
    ],
    "actions": ["list of key actions that occurred"],
    "emotions": [
      {"emotion": "emotion name", "intensity": 1-5, "context": "when/where this emotion appeared"}
    ],
    "emotionalLandscapeInterpretation": "2-3 sentences explaining what this particular combination of emotions suggests about the dream's psychological territory. What does it mean that these specific feelings appeared together?",
    "schredlScales": {
      "dreamLength": {"value": ${wordCount}, "label": "Short/Medium/Long based on word count", "interpretation": "What this length suggests about dream recall and processing depth"},
      "realism": {"value": 1-5, "label": "Realistic/Somewhat Surreal/Bizarre", "interpretation": "Explain what this level of realism might indicate about the dream's function"},
      "emotionalIntensityPositive": {"value": 0-5, "label": "None/Low/Moderate/High/Very High", "interpretation": "What the positive emotional intensity reveals"},
      "emotionalIntensityNegative": {"value": 0-5, "label": "None/Low/Moderate/High/Very High", "interpretation": "What the negative emotional intensity reveals"},
      "clarity": {"value": 1-5, "label": "Vague/Somewhat Clear/Clear/Very Clear/Vivid", "interpretation": "What dream clarity suggests about memory consolidation"},
      "selfParticipation": {"value": 1-5, "label": "Observer/Mostly Observing/Balanced/Active Participant/Central Actor", "interpretation": "What your level of participation indicates"},
      "socialDensity": {"value": 1-5, "label": "Solitary/Few Others/Moderate/Populated/Crowded", "interpretation": "What the social density suggests about current relational focus"},
      "agency": {"value": 1-5, "label": "Passive/Limited/Moderate/Significant/Full Control", "interpretation": "What your sense of agency in the dream might reflect"},
      "narrativeCoherence": {"value": 1-5, "label": "Fragmented/Loosely Connected/Coherent/Very Coherent/Perfectly Linear", "interpretation": "What narrative coherence indicates about the dream's integrative work"}
    }
  },
  "cdtAnalysis": {
    "sectionContext": "Cognitive Dream Theory views dreams as the mind's way of processing experiences and integrating memories. This section examines how your dream draws from your memory 'vault' and what themes your sleeping mind was working through.",
    "vaultActivation": {
      "assessment": "Overall assessment of how the dream activated your memory systems",
      "recentMemories": ["specific recent memory elements visible in the dream"],
      "distantMemories": ["older memory elements or long-standing themes present"],
      "interpretation": "2-3 sentences on what this pattern of memory activation suggests about what your mind is currently integrating"
    },
    "cognitiveDrift": {
      "themes": [
        {"theme": "primary drift theme", "confidence": 0.0 to 1.0, "explanation": "How this theme manifested in the dream imagery"}
      ],
      "interpretation": "2-3 sentences explaining what these cognitive drift patterns reveal about your current psychological focus and emotional processing"
    },
    "convergenceIndicators": {
      "present": true or false,
      "evidence": "Specific evidence from the dream supporting this assessment",
      "resolutionType": "If convergence present, what type of psychological resolution occurred",
      "meaning": "What the presence or absence of convergence suggests about the dream's work"
    },
    "dreamTypeExplanation": "2-3 sentences explaining what '${transcript.includes('lucid') ? 'Lucid' : 'this type of'}' dreams represent in CDT and why this dream fits that classification. Help the dreamer understand what this categorization means for interpreting their experience.",
    "dreamTypeRationale": "Specific elements from the dream that led to this classification"
  },
  "archetypalResonances": {
    "sectionContext": "Jungian archetypes are universal patterns in the human psyche that appear across cultures and throughout history. When archetypal themes emerge in dreams, they often signal that we're engaging with fundamental life transitions or psychological developments. These patterns are offered as lenses for reflection, not definitive interpretations.",
    "primaryArchetype": {
      "name": "The primary archetypal pattern present (e.g., 'The Self', 'The Threshold', 'The Shadow', 'Anima/Animus', 'The Hero's Journey')",
      "description": "2-3 sentences explaining what this archetype represents universally in human psychology",
      "manifestation": "How this archetype specifically appeared in the dream's imagery and narrative",
      "reflection": "A thoughtful exploration of what engaging with this archetype at this time might suggest. Frame as possibility, not diagnosis.",
      "elements": ["specific dream elements that evoke this archetype"]
    },
    "secondaryPatterns": [
      {
        "name": "Secondary archetypal theme if present",
        "briefDescription": "1-2 sentences on how this pattern appeared and what it might add to the interpretation"
      }
    ],
    "scenarios": [
      {"name": "Archetypal scenario name (e.g., 'Lovers' Embrace', 'The Night Sea Journey')", "description": "What this universal scenario represents and how it manifested in this dream"}
    ]
  },
  "reflectivePrompts": [
    {
      "category": "Emotional",
      "prompt": "A specific, grounded question about the emotions in this dream",
      "dreamConnection": "The specific imagery or moment this question relates to",
      "whyThisMatters": "Brief note on why exploring this could be valuable"
    },
    {
      "category": "Exploration",
      "prompt": "A question inviting curiosity about the dream's symbols or settings",
      "dreamConnection": "The specific element this explores",
      "whyThisMatters": "Why this element is worth sitting with"
    },
    {
      "category": "Integration",
      "prompt": "A question connecting the dream to waking life",
      "dreamConnection": "How this bridges dream and waking experience",
      "whyThisMatters": "The potential value of this integration"
    }
  ]
}

IMPORTANT GUIDELINES:
- Write the synthesis as a cohesive narrative, not bullet points. It should feel like thoughtful reflection, not data summary.
- Every interpretation should use non-prescriptive language ("may reflect", "could suggest", "might indicate")
- The dreamer is the final authority on their dream's meaning - offer perspectives, not pronouncements
- Reference specific images, characters, and moments from the dream throughout
- Balance psychological depth with accessibility - avoid jargon, explain concepts naturally
- The tone should be warm, curious, and genuinely interested in the dream's meaning`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a warm, insightful dream analyst who helps people understand their dreams. Respond only with valid JSON, no markdown code blocks. Your analysis should feel like a thoughtful conversation, not a clinical report.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const responseText = completion.choices[0].message.content;

    // Parse the JSON response
    let analysis;
    try {
      let cleanedResponse = responseText;
      if (responseText.includes('```json')) {
        cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (responseText.includes('```')) {
        cleanedResponse = responseText.replace(/```\n?/g, '');
      }
      analysis = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({
        error: 'Failed to parse analysis response',
        details: parseError.message
      });
    }

    // Step 4: Generate dream visualization image with DALL-E
    console.log('Step 4: Generating dream visualization...');
    let dreamImage = null;
    try {
      dreamImage = await generateDreamImage(analysis);
      console.log('Dream image generation:', dreamImage.status);
    } catch (imageError) {
      console.error('Dream image generation failed (non-blocking):', imageError.message);
      dreamImage = { url: null, prompt: 'Image generation failed', status: 'failed' };
    }

    console.log('Dream processing complete!');

    // Step 5: Save dream to SQLite database (for persistence)
    const dreamData = {
      title: analysis.overview?.title || 'Untitled Dream',
      transcript,
      wordCount: transcript.split(/\s+/).filter(w => w).length,
      recordingDuration: parseInt(duration),
      emotionalTone: analysis.overview?.emotionalTone || '',
      dreamType: analysis.overview?.dreamType || 'Unknown',
      dreamTypeConfidence: analysis.overview?.dreamTypeConfidence || 0,
      analysis: JSON.stringify(analysis),
      prosody: prosodyAnalysis ? JSON.stringify(prosodyAnalysis) : null,
      dreamImage: dreamImage ? JSON.stringify(dreamImage) : null,
      isArchived: 0,
      isPrivate: 0
    };

    // Insert into SQLite
    const stmt = db.prepare(`
      INSERT INTO dreams (
        userId, title, transcript, wordCount, recordingDuration,
        emotionalTone, dreamType, dreamTypeConfidence,
        analysis, prosody, dreamImage, isArchived, isPrivate,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        datetime('now'), datetime('now')
      )
    `);
    const result = stmt.run(
      userId,
      dreamData.title,
      dreamData.transcript,
      dreamData.wordCount,
      dreamData.recordingDuration,
      dreamData.emotionalTone,
      dreamData.dreamType,
      dreamData.dreamTypeConfidence,
      dreamData.analysis,
      dreamData.prosody,
      dreamData.dreamImage,
      dreamData.isArchived,
      dreamData.isPrivate
    );
    const dreamId = String(result.lastInsertRowid);

    console.log(`Dream saved to SQLite with ID: ${dreamId} for user: ${userId}`);

    res.json({
      success: true,
      dreamId,
      transcript,
      wordCount: transcript.split(/\s+/).filter(w => w).length,
      recordingDuration: parseInt(duration),
      analysis,
      prosody: prosodyAnalysis,
      dreamImage
    });

  } catch (error) {
    console.error('Dream processing error:', error);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Dream processing failed',
      details: error.message
    });
  }
});

// ============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ============================================

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Price IDs for subscription tiers (these should be created in Stripe Dashboard)
// For testing, we'll create them dynamically if they don't exist
const STRIPE_PRICES = {
  tier1: process.env.STRIPE_PRICE_TIER1 || 'price_tier1_noticing',
  tier2: process.env.STRIPE_PRICE_TIER2 || 'price_tier2_patterning',
  tier3: process.env.STRIPE_PRICE_TIER3 || 'price_tier3_integration'
};

const TIER_DETAILS = {
  tier1: { name: 'Noticing', price: 999, description: '10 minutes per month' },
  tier2: { name: 'Patterning', price: 1999, description: '20 minutes per month' },
  tier3: { name: 'Integration', price: 2999, description: '30 minutes per month' }
};

// Create a Stripe Checkout Session for subscription
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { tier, customerId, successUrl, cancelUrl } = req.body;

    if (!tier || !TIER_DETAILS[tier]) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const tierDetail = TIER_DETAILS[tier];

    // For test mode, we'll create a price on the fly
    // In production, you should use pre-created price IDs from Stripe Dashboard
    let priceId = STRIPE_PRICES[tier];

    // Try to use the price, or create a new one if it doesn't exist
    try {
      await stripe.prices.retrieve(priceId);
    } catch (e) {
      // Price doesn't exist, create a product and price
      console.log(`Creating Stripe product and price for ${tier}...`);

      const product = await stripe.products.create({
        name: `CDT ${tierDetail.name}`,
        description: tierDetail.description
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tierDetail.price,
        currency: 'usd',
        recurring: { interval: 'month' }
      });

      priceId = price.id;
      console.log(`Created price: ${priceId}`);
    }

    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl || `${req.headers.origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/account?canceled=true`,
      metadata: {
        tier: tier
      }
    };

    // If we have a customer ID, attach it to the session
    if (customerId) {
      sessionConfig.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`Stripe checkout session created: ${session.id}`);

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Create a Stripe Customer Portal session
app.post('/api/stripe/create-portal-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.origin}/account`
    });

    console.log(`Stripe portal session created for customer: ${customerId}`);

    res.json({
      url: session.url
    });

  } catch (error) {
    console.error('Stripe portal error:', error);
    res.status(500).json({
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Get checkout session details (for verifying successful payment)
app.get('/api/stripe/checkout-session/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: session.customer?.id || session.customer,
      subscriptionId: session.subscription?.id || session.subscription,
      tier: session.metadata?.tier
    });

  } catch (error) {
    console.error('Stripe session retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session',
      details: error.message
    });
  }
});

// Stripe webhook endpoint for handling subscription events
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Stripe webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`Checkout completed for customer: ${session.customer}, tier: ${session.metadata?.tier}`);
      // Here you would update the user's subscription in your database
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      console.log(`Subscription canceled: ${deletedSub.id}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`CDT Backend server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health       - Health check');
  console.log('');
  console.log('Protected endpoints (require Clerk authentication):');
  console.log('  GET    /api/dreams         - List user dreams');
  console.log('  POST   /api/dreams/upload  - Upload dream audio');
  console.log('  GET    /api/dreams/:id     - Get single dream');
  console.log('  PATCH  /api/dreams/:id     - Update dream');
  console.log('  DELETE /api/dreams/:id     - Delete dream');
  console.log('');
  console.log('Public endpoints:');
  console.log('  POST /api/transcribe   - Transcribe audio to text');
  console.log('  POST /api/analyze      - Analyze dream transcript');
  console.log('  POST /api/process-dream - Combined transcribe + analyze');
  console.log('  POST /api/stripe/create-checkout-session - Create Stripe checkout');
  console.log('  POST /api/stripe/create-portal-session - Create Stripe portal');
  console.log('  GET  /api/stripe/checkout-session/:id - Get session details');
  console.log('  POST /api/stripe/webhook - Stripe webhook');
});

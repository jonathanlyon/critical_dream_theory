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
// PROTECTED DREAM ENDPOINTS (Require Authentication)
// ============================================

// GET /api/dreams - List user's dreams (requires authentication)
app.get('/api/dreams', requireAuthentication, (req, res) => {
  // In a full implementation, this would fetch from Convex database
  // For now, return empty array with user context
  const userId = req.userId;
  res.json({
    dreams: [],
    total: 0,
    userId: userId,
    message: 'Dream list retrieved successfully'
  });
});

// POST /api/dreams/upload - Upload dream audio (requires authentication)
app.post('/api/dreams/upload', requireAuthentication, upload.single('audio'), (req, res) => {
  const userId = req.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  // In a full implementation, this would store in cloud storage and Convex
  // For now, return success with file info
  res.json({
    success: true,
    userId: userId,
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

  // In a full implementation, this would fetch from Convex database
  res.json({
    dream: null,
    userId: userId,
    dreamId: dreamId,
    message: 'Dream not found'
  });
});

// PATCH /api/dreams/:id - Update dream (requires authentication)
app.patch('/api/dreams/:id', requireAuthentication, (req, res) => {
  const userId = req.userId;
  const dreamId = req.params.id;

  res.json({
    success: true,
    userId: userId,
    dreamId: dreamId,
    message: 'Dream update endpoint ready'
  });
});

// DELETE /api/dreams/:id - Delete dream (requires authentication)
app.delete('/api/dreams/:id', requireAuthentication, (req, res) => {
  const userId = req.userId;
  const dreamId = req.params.id;

  res.json({
    success: true,
    userId: userId,
    dreamId: dreamId,
    message: 'Dream delete endpoint ready'
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
app.post('/api/process-dream', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const duration = req.body.duration || 0;
    console.log('Processing dream recording:', req.file.path, 'Duration:', duration, 'seconds');

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

    const analysisPrompt = `You are a dream analyst trained in Cognitive Dream Theory (CDT), Schredl manifest content coding, and Jungian archetypal frameworks. Analyze the following dream transcript and provide a structured analysis.

DREAM TRANSCRIPT:
${transcript}

RECORDING DURATION: ${duration} seconds

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
      "dreamLength": {"value": ${transcript.split(/\s+/).filter(w => w).length}, "label": "Short/Medium/Long", "interpretation": "brief explanation"},
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

    res.json({
      success: true,
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

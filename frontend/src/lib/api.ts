// API service for dream transcription and analysis

const API_BASE_URL = 'http://localhost:3001/api';

export interface TranscriptionResult {
  transcript: string;
  wordCount: number;
  success: boolean;
}

export interface DreamAnalysis {
  overview: {
    title: string;
    emotionalTone: string;
    dreamType: string;
    dreamTypeConfidence: number;
    summary: string;
  };
  manifestContent: {
    characters: Array<{ name: string; role: string; familiarity: string }>;
    settings: Array<{ location: string; familiarity: string }>;
    actions: string[];
    emotions: Array<{ emotion: string; intensity: number; context: string }>;
    schredlScales: {
      dreamLength: { value: number; label: string; interpretation: string };
      realism: { value: number; label: string; interpretation: string };
      emotionalIntensityPositive: { value: number; label: string; interpretation: string };
      emotionalIntensityNegative: { value: number; label: string; interpretation: string };
      clarity: { value: number; label: string; interpretation: string };
      selfParticipation: { value: number; label: string; interpretation: string };
      socialDensity: { value: number; label: string; interpretation: string };
      agency: { value: number; label: string; interpretation: string };
      narrativeCoherence: { value: number; label: string; interpretation: string };
    };
  };
  cdtAnalysis: {
    vaultActivation: {
      assessment: string;
      recentMemories: string[];
      distantMemories: string[];
      interpretation: string;
    };
    cognitiveDrift: {
      themes: Array<{ theme: string; confidence: number }>;
      interpretation: string;
    };
    convergenceIndicators: {
      present: boolean;
      evidence: string;
      resolutionType: string;
    };
    dreamTypeRationale: string;
  };
  archetypalResonances: {
    threshold: {
      present: boolean;
      elements: string[];
      reflection: string | null;
    };
    shadow: {
      present: boolean;
      elements: string[];
      reflection: string | null;
    };
    animaAnimus: {
      present: boolean;
      elements: string[];
      reflection: string | null;
    };
    selfWholeness: {
      present: boolean;
      elements: string[];
      reflection: string | null;
    };
    scenarios: Array<{ name: string; description: string }>;
  };
  reflectivePrompts: Array<{
    category: string;
    prompt: string;
    dreamConnection: string;
  }>;
}

export interface ProsodyAnalysis {
  dominantEmotions: Array<{ emotion: string; intensity: number }>;
  emotionalArc: string;
  overallTone: string;
  hesitationMarkers: Array<{ time: number; emotion: string; intensity: number }>;
}

export interface DreamImage {
  url: string | null;
  prompt: string;
  status: 'generated' | 'pending' | 'failed';
}

export interface ProcessDreamResult {
  success: boolean;
  transcript: string;
  wordCount: number;
  recordingDuration: number;
  analysis: DreamAnalysis;
  prosody: ProsodyAnalysis | null;
  dreamImage: DreamImage | null;
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Transcribe audio to text
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Transcription failed');
  }

  return response.json();
}

// Process dream (transcribe + analyze in one call)
export async function processDream(
  audioBlob: Blob,
  duration: number,
  onProgress?: (step: string, progress: number) => void
): Promise<ProcessDreamResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('duration', duration.toString());

  onProgress?.('Uploading audio...', 10);

  const response = await fetch(`${API_BASE_URL}/process-dream`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Dream processing failed');
  }

  onProgress?.('Processing complete', 100);

  return response.json();
}

// Analyze text transcript (if already have transcript)
export async function analyzeDream(
  transcript: string,
  duration?: number
): Promise<DreamAnalysis> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript, duration }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Analysis failed');
  }

  const result = await response.json();
  return result.analysis;
}

// ============================================
// STRIPE SUBSCRIPTION API
// ============================================

export type SubscriptionTier = 'tier1' | 'tier2' | 'tier3';

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface CheckoutSessionDetails {
  status: string;
  paymentStatus: string;
  customerId: string;
  subscriptionId: string;
  tier: SubscriptionTier;
}

export interface PortalSessionResult {
  url: string;
}

// Create a Stripe checkout session for subscription
export async function createCheckoutSession(
  tier: SubscriptionTier,
  customerId?: string
): Promise<CheckoutSessionResult> {
  const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tier,
      customerId,
      successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${window.location.origin}/account?canceled=true`
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to create checkout session');
  }

  return response.json();
}

// Create a Stripe customer portal session
export async function createPortalSession(
  customerId: string
): Promise<PortalSessionResult> {
  const response = await fetch(`${API_BASE_URL}/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/account`
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to create portal session');
  }

  return response.json();
}

// Get checkout session details
export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionDetails> {
  const response = await fetch(`${API_BASE_URL}/stripe/checkout-session/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to get session details');
  }

  return response.json();
}

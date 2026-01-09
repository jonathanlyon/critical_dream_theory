import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Cognitive Dream Theory Database Schema
// Based on CDT, Schredl manifest content coding, and Jungian frameworks

export default defineSchema({
  // Users table - synced with Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("tier1"),
      v.literal("tier2"),
      v.literal("tier3")
    ),
    minutesUsedThisMonth: v.number(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // Dreams table - individual dream recordings
  dreams: defineTable({
    userId: v.id("users"),
    title: v.string(), // AI-generated title
    audioUrl: v.optional(v.string()), // Cloud storage reference
    audioStorageId: v.optional(v.id("_storage")), // Convex file storage
    transcript: v.optional(v.string()),
    durationSeconds: v.number(),
    wordCount: v.optional(v.number()),
    dreamType: v.optional(
      v.union(
        v.literal("resolution"),
        v.literal("replay"),
        v.literal("residual"),
        v.literal("generative"),
        v.literal("lucid")
      )
    ),
    dreamTypeConfidence: v.optional(v.number()), // 0-1
    emotionalTone: v.optional(v.string()),
    isPrivate: v.boolean(), // Excluded from longitudinal analysis
    isArchived: v.boolean(), // Soft deleted
    recordedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "recordedAt"])
    .index("by_user_archived", ["userId", "isArchived"])
    .index("by_user_type", ["userId", "dreamType"]),

  // Dream analyses - full CDT/Schredl/Jungian analysis
  dreamAnalyses: defineTable({
    dreamId: v.id("dreams"),
    aiImageUrl: v.optional(v.string()),
    aiImageStorageId: v.optional(v.id("_storage")),

    // Manifest content (Schredl method)
    manifestContent: v.optional(
      v.object({
        characters: v.array(v.string()),
        settings: v.array(v.string()),
        actions: v.array(v.string()),
        emotions: v.array(
          v.object({
            emotion: v.string(),
            intensity: v.number(), // 0-5
          })
        ),
      })
    ),

    // Schredl scales
    schredlScales: v.optional(
      v.object({
        length: v.number(), // 3-point scale for narrative complexity
        emotionalIntensityPos: v.number(), // 0-5
        emotionalIntensityNeg: v.number(), // 0-5
        bizarreness: v.number(), // 4-point scale
        socialDensity: v.number(), // Number of characters + interactions
        agency: v.number(), // Spectrum of control
        coherence: v.number(), // Narrative flow score
      })
    ),

    // Interaction coding
    interactions: v.optional(
      v.object({
        aggression: v.array(
          v.object({
            type: v.string(), // physical/verbal
            direction: v.string(), // to/from dreamer
          })
        ),
        affiliation: v.array(v.string()),
        avoidance: v.array(v.string()),
      })
    ),

    // CDT vault activation
    vaultActivation: v.optional(
      v.object({
        episodicRecent: v.array(v.string()), // Events 1-7 days
        episodicDistant: v.array(v.string()),
        emotionalSalience: v.number(), // 0-1
        identityRelevance: v.number(), // 0-1
      })
    ),

    // Cognitive drift assessment
    cognitiveDrift: v.optional(
      v.object({
        identity: v.optional(v.string()),
        emotional: v.optional(v.string()),
        developmental: v.optional(v.string()),
        trauma: v.optional(v.string()),
      })
    ),

    // Archetypal resonances (Jungian)
    archetypalResonances: v.optional(
      v.object({
        threshold: v.array(v.string()),
        shadow: v.array(v.string()),
        animaAnimus: v.array(v.string()),
        selfWholeness: v.array(v.string()),
        scenarios: v.array(v.string()),
      })
    ),

    // Reflective prompts
    reflectivePrompts: v.array(v.string()),

    // Full narrative report (Markdown)
    fullNarrative: v.optional(v.string()),

    createdAt: v.number(),
  }).index("by_dream", ["dreamId"]),

  // Dream context - sleep quality, life events, mood
  dreamContext: defineTable({
    dreamId: v.id("dreams"),

    // Groningen Sleep Quality responses
    sleepQualityResponses: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.boolean(),
        })
      )
    ),
    sleepQualityScore: v.optional(v.number()),

    // Life events
    lifeEvents: v.array(v.string()),

    // Pre-recording mood
    mood: v.optional(v.string()),

    createdAt: v.number(),
  }).index("by_dream", ["dreamId"]),

  // Prosody analysis - Hume API results
  prosodyAnalysis: defineTable({
    dreamId: v.id("dreams"),

    // Full Hume API response
    humeResponse: v.optional(v.any()),

    // Extracted markers
    toneMarkers: v.optional(
      v.array(
        v.object({
          timestamp: v.number(),
          tone: v.string(),
          confidence: v.number(),
        })
      )
    ),

    // Pace analysis
    paceAnalysis: v.optional(
      v.object({
        averagePace: v.number(), // words per minute
        variations: v.array(
          v.object({
            timestamp: v.number(),
            pace: v.string(), // fast/slow/normal
          })
        ),
      })
    ),

    // Hesitation markers
    hesitationMarkers: v.array(v.number()), // timestamps

    createdAt: v.number(),
  }).index("by_dream", ["dreamId"]),

  // User settings
  userSettings: defineTable({
    userId: v.id("users"),
    notificationReminders: v.boolean(),
    notificationWeeklySummary: v.boolean(),
    notificationMilestones: v.boolean(),
    preferredMicrophone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});

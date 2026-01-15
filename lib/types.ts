// Shared TypeScript types for the memory service
// Based on AWS AgentCore Memory schema

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export interface LongTermBucket {
  id: string;
  name: string;
  description: string;
  isUnstructured?: boolean; // If true, only stores text field
  schema: SchemaField[];
}

export interface ServiceConfig {
  id: string;
  name: string;
  redisUrl?: string;  // Redis connection URL (e.g., redis://user:password@host:port)
  serviceType?: 'fixed' | 'custom';  // 'fixed' for AWS-style fixed schema, 'custom' for user-defined
  memoryTypes: MemoryType[];  // Which memory types are enabled for this service
  schemas: {
    shortTermFields: SchemaField[];
    longTermBuckets: LongTermBucket[];
  };
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// SHORT-TERM MEMORY (Events)
// ============================================

// What you POST to create a short-term event
export interface ShortTermEventInput {
  userId: string;                          // Required: 1-255 chars
  sessionId?: string;                      // Optional: 1-100 chars
  role: 'USER' | 'ASSISTANT' | 'TOOL';     // Message role
  text: string;                            // The message content
  timestamp: number;                       // Unix timestamp in milliseconds
  metadata?: Record<string, string>;       // Optional: max 15 key-value pairs
}

// What you GET back (stored event with auto-generated fields)
export interface ShortTermEvent {
  eventId: string;                         // Auto-generated: "evt-..."
  userId: string;
  sessionId?: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  text: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

// Legacy interface for backward compatibility
export interface ShortTermMemory {
  user_id: string;
  session_id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

// ============================================
// LONG-TERM MEMORY (Memory Records)
// ============================================

// Memory types (4 built-in types from AWS AgentCore)
export type MemoryType =
  | 'user_preferences'   // User preferences, choices, and styles
  | 'semantic'           // Facts and contextual knowledge
  | 'summary'            // Session summaries
  | 'episodic';          // Structured episodes (scenario, intent, actions, outcome)

// Content can be text or structured
export interface MemoryContent {
  text?: string;
  structured?: Record<string, any>;
}

// The long-term memory record schema
export interface LongTermMemoryRecord {
  memoryRecordId: string;                  // Auto-generated: "mem-..." (40-50 chars)
  memoryType: MemoryType;                  // Which type of memory this is
  userId: string;                          // User this memory belongs to
  content: MemoryContent;                  // The actual memory (text or structured)
  createdAt: string;                       // ISO timestamp (auto-generated)
  metadata?: Record<string, string>;       // Optional: max 15 key-value pairs
}

// Legacy interface for backward compatibility
export interface LongTermMemory {
  id: string;
  bucket: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ValidationError {
  field: string;
  message: string;
  expected?: string;
  received?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface StoreShortTermRequest {
  service_id: string;
  data: ShortTermMemory;
}

export interface RetrieveShortTermRequest {
  session_id: string;
  limit?: number;
}

export interface StoreLongTermRequest {
  service_id: string;
  user_id: string;
  bucket_name: string;
  data: Record<string, any>;
}

export interface RetrieveLongTermRequest {
  user_id: string;
  service_id: string;
  bucket_name?: string;
}


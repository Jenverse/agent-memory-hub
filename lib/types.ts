// Shared TypeScript types for the memory service

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
  agentPurpose: string;
  memoryGoals: string[];
  schemas: {
    shortTermFields: SchemaField[];
    longTermBuckets: LongTermBucket[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ShortTermMemory {
  user_id: string;
  session_id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

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


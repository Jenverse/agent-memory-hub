// Schema validation utilities
import { SchemaField, ValidationError } from './types';

export function validateAgainstSchema(
  data: Record<string, any>,
  schema: SchemaField[]
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const field of schema) {
    if (field.required && !(field.name in data)) {
      errors.push({
        field: field.name,
        message: `Missing required field: ${field.name}`,
        expected: field.type,
      });
    }
  }

  // Check field types
  for (const [key, value] of Object.entries(data)) {
    const fieldSchema = schema.find((f) => f.name === key);

    if (!fieldSchema) {
      errors.push({
        field: key,
        message: `Unknown field: ${key}. Not defined in schema.`,
      });
      continue;
    }

    const actualType = getValueType(value);
    if (actualType !== fieldSchema.type) {
      errors.push({
        field: key,
        message: `Type mismatch for field: ${key}`,
        expected: fieldSchema.type,
        received: actualType,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function getValueType(value: any): string {
  if (value === null || value === undefined) {
    return 'undefined';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  return typeof value;
}

export function createValidationErrorResponse(errors: ValidationError[]) {
  return {
    success: false,
    error: 'Validation failed',
    errors,
  };
}


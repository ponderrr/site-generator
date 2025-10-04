/**
 * @fileoverview Zod-based Validation System
 * 
 * Modern validation system using Zod library instead of custom implementation.
 * Provides better type safety, performance, and maintainability.
 */

import { z } from 'zod';
import { ValidationResult, ValidationError, ValidationWarning } from '../types';

/**
 * Enhanced validation result with Zod integration
 */
export interface ZodValidationResult extends ValidationResult {
  zodIssues?: z.ZodIssue[];
}

/**
 * Zod-based validator that replaces the custom validation system
 */
export class ZodValidator {
  private schemas: Map<string, z.ZodSchema> = new Map();

  /**
   * Add a Zod schema for a field
   */
  addSchema(field: string, schema: z.ZodSchema): void {
    this.schemas.set(field, schema);
  }

  /**
   * Validate an object against all registered schemas
   */
  validate(data: any): ZodValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const zodIssues: z.ZodIssue[] = [];

    // Create a combined schema from all field schemas
    const combinedSchema = this.createCombinedSchema();
    
    try {
      const result = combinedSchema.safeParse(data);
      
      if (!result.success) {
        zodIssues.push(...result.error.issues);
        
        // Convert Zod issues to our validation errors
        for (const issue of result.error.issues) {
          errors.push({
            field: issue.path.join('.'),
            message: issue.message,
            value: this.getNestedValue(data, issue.path),
            code: issue.code.toUpperCase()
          });
        }
      }
    } catch (error) {
      errors.push({
        field: 'root',
        message: `Validation failed: ${error}`,
        value: data,
        code: 'VALIDATION_ERROR'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      zodIssues
    };
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any, context?: any): ZodValidationResult {
    const schema = this.schemas.get(field);
    
    if (!schema) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        zodIssues: []
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const zodIssues: z.ZodIssue[] = [];

    try {
      const result = schema.safeParse(value);
      
      if (!result.success) {
        zodIssues.push(...result.error.issues);
        
        for (const issue of result.error.issues) {
          errors.push({
            field,
            message: issue.message,
            value,
            code: issue.code.toUpperCase()
          });
        }
      }
    } catch (error) {
      errors.push({
        field,
        message: `Field validation failed: ${error}`,
        value,
        code: 'VALIDATION_ERROR'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      zodIssues
    };
  }

  /**
   * Create a combined schema from all registered schemas
   */
  private createCombinedSchema(): z.ZodSchema {
    const shape: Record<string, z.ZodSchema> = {};
    
    for (const [field, schema] of this.schemas) {
      shape[field] = schema;
    }
    
    return z.object(shape);
  }

  /**
   * Get nested value from object using path
   */
  private getNestedValue(obj: any, path: (string | number)[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  /**
   * Clear all schemas
   */
  clearSchemas(): void {
    this.schemas.clear();
  }

  /**
   * Remove schema for a specific field
   */
  removeSchema(field: string): void {
    this.schemas.delete(field);
  }

  /**
   * Get all registered field names
   */
  getRegisteredFields(): string[] {
    return Array.from(this.schemas.keys());
  }
}

/**
 * Pre-built Zod schemas for common use cases
 */
export const CommonSchemas = {
  /**
   * URL validation schema
   */
  url: z.string().url('Invalid URL format'),
  
  /**
   * Email validation schema
   */
  email: z.string().email('Invalid email format'),
  
  /**
   * Required string schema
   */
  requiredString: (minLength = 1, maxLength = 1000) => 
    z.string().min(minLength, `Minimum length is ${minLength}`).max(maxLength, `Maximum length is ${maxLength}`),
  
  /**
   * Optional string schema
   */
  optionalString: (minLength = 1, maxLength = 1000) => 
    z.string().min(minLength, `Minimum length is ${minLength}`).max(maxLength, `Maximum length is ${maxLength}`).optional(),
  
  /**
   * Positive number schema
   */
  positiveNumber: z.number().positive('Must be a positive number'),
  
  /**
   * Integer schema
   */
  integer: z.number().int('Must be an integer'),
  
  /**
   * Boolean schema
   */
  boolean: z.boolean(),
  
  /**
   * Array schema with length constraints
   */
  array: (minLength = 0, maxLength = 1000) => 
    z.array(z.any()).min(minLength, `Minimum array length is ${minLength}`).max(maxLength, `Maximum array length is ${maxLength}`),
  
  /**
   * Unique array schema
   */
  uniqueArray: (schema: z.ZodSchema) => 
    z.array(schema).refine((arr) => arr.length === new Set(arr).size, 'Array must contain unique items'),
  
  /**
   * Object schema with required fields
   */
  object: (requiredFields: string[], allowExtra = true) => {
    const shape: Record<string, z.ZodSchema> = {};
    
    for (const field of requiredFields) {
      shape[field] = z.any();
    }
    
    const baseSchema = z.object(shape);
    return allowExtra ? baseSchema.passthrough() : baseSchema.strict();
  }
};

/**
 * Specialized validators for common use cases
 */
export class URLValidator {
  private validator: ZodValidator;

  constructor() {
    this.validator = new ZodValidator();
    this.validator.addSchema('url', CommonSchemas.url);
  }

  validate(url: string): ZodValidationResult {
    return this.validator.validate({ url });
  }
}

export class EmailValidator {
  private validator: ZodValidator;

  constructor() {
    this.validator = new ZodValidator();
    this.validator.addSchema('email', CommonSchemas.email);
  }

  validate(email: string): ZodValidationResult {
    return this.validator.validate({ email });
  }
}

export class ConfigValidator {
  private validator: ZodValidator;

  constructor() {
    this.validator = new ZodValidator();
    
    // Define configuration schema
    const configSchema = z.object({
      source: CommonSchemas.url,
      output: CommonSchemas.requiredString(1, 500),
      baseUrl: CommonSchemas.url,
      title: CommonSchemas.optionalString(1, 200),
      description: CommonSchemas.optionalString(1, 500),
      build: z.object({
        concurrency: z.number().int().min(1).max(100),
        timeout: z.number().min(1000).max(300000)
      }).optional()
    });

    this.validator.addSchema('config', configSchema);
  }

  validate(config: any): ZodValidationResult {
    return this.validator.validateField('config', config);
  }
}

/**
 * Migration helper to convert old validation rules to Zod schemas
 */
export class ValidationMigrationHelper {
  /**
   * Convert old validation result to Zod-compatible format
   */
  static migrateValidationResult(oldResult: ValidationResult): ZodValidationResult {
    return {
      valid: oldResult.valid,
      errors: oldResult.errors,
      warnings: oldResult.warnings,
      zodIssues: []
    };
  }

  /**
   * Create Zod schema from old validation rule
   */
  static createZodSchemaFromRule(ruleType: string, options: any): z.ZodSchema {
    switch (ruleType) {
      case 'required':
        return z.any().refine(val => val !== null && val !== undefined && val !== '', 'This field is required');
      
      case 'string':
        return z.string();
      
      case 'number':
        return z.number();
      
      case 'boolean':
        return z.boolean();
      
      case 'array':
        return z.array(z.any());
      
      case 'object':
        return z.object({});
      
      case 'email':
        return CommonSchemas.email;
      
      case 'url':
        return CommonSchemas.url;
      
      default:
        return z.any();
    }
  }
}

/**
 * Default validators for backward compatibility
 */
export const zodURLValidator = new URLValidator();
export const zodEmailValidator = new EmailValidator();
export const zodConfigValidator = new ConfigValidator();

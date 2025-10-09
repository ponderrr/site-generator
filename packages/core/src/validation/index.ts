import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DeepPartial,
} from "../types/index.js";

// Export the new Zod-based validation system
export * from "./zod-validator.js";

/**
 * @deprecated Use ZodValidator instead for better type safety and performance
 */
export class Validator {
  private rules: Map<string, ValidationRule[]> = new Map();

  /**
   * Add a validation rule for a field
   */
  addRule(field: string, rule: ValidationRule): void {
    const existingRules = this.rules.get(field) || [];
    existingRules.push(rule);
    this.rules.set(field, existingRules);
  }

  /**
   * Validate an object against all rules
   */
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [field, rules] of this.rules) {
      const fieldValue = this.getNestedValue(data, field);

      for (const rule of rules) {
        const ruleResult = rule.validate(fieldValue, data);

        if (ruleResult.type === "error") {
          errors.push(ruleResult.error);
        } else if (ruleResult.type === "warning") {
          warnings.push(ruleResult.warning);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single field
   */
  validateField(
    field: string,
    value: any,
    context?: any,
  ): {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const rules = this.rules.get(field) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      const ruleResult = rule.validate(value, context, field);

      if (ruleResult.type === "error") {
        errors.push({ ...ruleResult.error, field });
      } else if (ruleResult.type === "warning") {
        warnings.push({ ...ruleResult.warning, field });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Remove rules for a specific field
   */
  removeFieldRules(field: string): void {
    this.rules.delete(field);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}

export interface ValidationRule {
  validate(value: any, context?: any, field?: string): RuleResult;
}

export type RuleResult =
  | { type: "valid" }
  | { type: "error"; error: ValidationError }
  | { type: "warning"; warning: ValidationWarning };

export class RequiredRule implements ValidationRule {
  private message?: string;

  constructor(message?: string) {
    this.message = message || undefined;
  }

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined || value === "") {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.message || "This field is required",
          value,
          code: "REQUIRED",
        },
      };
    }
    return { type: "valid" };
  }
}

export class TypeRule implements ValidationRule {
  constructor(
    private type: "string" | "number" | "boolean" | "object" | "array",
    private message?: string,
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" }; // Let required rule handle this
    }

    let isValid = false;
    switch (this.type) {
      case "string":
        isValid = typeof value === "string";
        break;
      case "number":
        isValid = typeof value === "number" && !isNaN(value);
        break;
      case "boolean":
        isValid = typeof value === "boolean";
        break;
      case "object":
        isValid =
          typeof value === "object" && value !== null && !Array.isArray(value);
        break;
      case "array":
        isValid = Array.isArray(value);
        break;
    }

    if (!isValid) {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.message || `Value must be of type ${this.type}`,
          value,
          code: "INVALID_TYPE",
        },
      };
    }

    return { type: "valid" };
  }
}

export class StringRule implements ValidationRule {
  constructor(
    private options: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      message?: string;
    } = {},
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" };
    }

    if (typeof value !== "string") {
      return { type: "valid" }; // Let type rule handle this
    }

    const errors: string[] = [];

    if (
      this.options.minLength !== undefined &&
      value.length < this.options.minLength
    ) {
      errors.push(`Minimum length is ${this.options.minLength}`);
    }

    if (
      this.options.maxLength !== undefined &&
      value.length > this.options.maxLength
    ) {
      errors.push(`Maximum length is ${this.options.maxLength}`);
    }

    if (this.options.pattern && !this.options.pattern.test(value)) {
      errors.push("Value does not match required pattern");
    }

    if (errors.length > 0) {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.options.message || errors.join(", "),
          value,
          code: "INVALID_STRING",
        },
      };
    }

    return { type: "valid" };
  }
}

export class NumberRule implements ValidationRule {
  constructor(
    private options: {
      min?: number;
      max?: number;
      integer?: boolean;
      positive?: boolean;
      message?: string;
    } = {},
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" };
    }

    if (typeof value !== "number" || isNaN(value)) {
      return { type: "valid" }; // Let type rule handle this
    }

    const errors: string[] = [];

    if (this.options.min !== undefined && value < this.options.min) {
      errors.push(`Minimum value is ${this.options.min}`);
    }

    if (this.options.max !== undefined && value > this.options.max) {
      errors.push(`Maximum value is ${this.options.max}`);
    }

    if (this.options.integer && !Number.isInteger(value)) {
      errors.push("Value must be an integer");
    }

    if (this.options.positive && value <= 0) {
      errors.push("Value must be positive");
    }

    if (errors.length > 0) {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.options.message || errors.join(", "),
          value,
          code: "INVALID_NUMBER",
        },
      };
    }

    return { type: "valid" };
  }
}

export class ArrayRule implements ValidationRule {
  constructor(
    private options: {
      minLength?: number;
      maxLength?: number;
      unique?: boolean;
      message?: string;
    } = {},
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" };
    }

    if (!Array.isArray(value)) {
      return { type: "valid" }; // Let type rule handle this
    }

    const errors: string[] = [];

    if (
      this.options.minLength !== undefined &&
      value.length < this.options.minLength
    ) {
      errors.push(`Minimum array length is ${this.options.minLength}`);
    }

    if (
      this.options.maxLength !== undefined &&
      value.length > this.options.maxLength
    ) {
      errors.push(`Maximum array length is ${this.options.maxLength}`);
    }

    if (this.options.unique) {
      const uniqueItems = new Set(value);
      if (uniqueItems.size !== value.length) {
        errors.push("Array must contain unique items");
      }
    }

    if (errors.length > 0) {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.options.message || errors.join(", "),
          value,
          code: "INVALID_ARRAY",
        },
      };
    }

    return { type: "valid" };
  }
}

export class ObjectRule implements ValidationRule {
  constructor(
    private options: {
      requiredFields?: string[];
      allowExtraFields?: boolean;
      message?: string;
    } = {},
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return { type: "valid" }; // Let type rule handle this
    }

    const errors: string[] = [];

    if (this.options.requiredFields) {
      for (const field of this.options.requiredFields) {
        if (!(field in value)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Note: allowExtraFields check would be implemented if needed

    if (errors.length > 0) {
      return {
        type: "error",
        error: {
          field: field || "",
          message: this.options.message || errors.join(", "),
          value,
          code: "INVALID_OBJECT",
        },
      };
    }

    return { type: "valid" };
  }
}

export class CustomRule implements ValidationRule {
  constructor(
    private validator: (value: any, context?: any) => boolean,
    private message: string,
    private warning: boolean = false,
  ) {}

  validate(value: any, context?: any, field?: string): RuleResult {
    if (value === null || value === undefined) {
      return { type: "valid" };
    }

    const isValid = this.validator(value, context);

    if (!isValid) {
      if (this.warning) {
        return {
          type: "warning",
          warning: {
            field: field || "",
            message: this.message,
            value,
            code: "CUSTOM_WARNING",
          },
        };
      } else {
        return {
          type: "error",
          error: {
            field: field || "",
            message: this.message,
            value,
            code: "CUSTOM_ERROR",
          },
        };
      }
    }

    return { type: "valid" };
  }
}

// Pre-built validators for common use cases
/**
 * @deprecated Use zodURLValidator instead
 */
export class URLValidator {
  private validator: Validator;

  constructor() {
    this.validator = new Validator();
    this.validator.addRule("url", new TypeRule("string"));
    this.validator.addRule(
      "url",
      new CustomRule((value: string) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }, "Invalid URL format"),
    );
  }

  validate(url: string): ValidationResult {
    return this.validator.validate({ url });
  }
}

/**
 * @deprecated Use zodEmailValidator instead
 */
export class EmailValidator {
  private validator: Validator;
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor() {
    this.validator = new Validator();
    this.validator.addRule("email", new TypeRule("string"));
    this.validator.addRule(
      "email",
      new CustomRule(
        (value: string) => this.emailRegex.test(value),
        "Invalid email format",
      ),
    );
  }

  validate(email: string): ValidationResult {
    return this.validator.validate({ email });
  }
}

/**
 * @deprecated Use zodConfigValidator instead
 */
export class ConfigValidator {
  private validator: Validator;

  constructor() {
    this.validator = new Validator();

    // URL validation
    this.validator.addRule(
      "source",
      new RequiredRule("Source URL is required"),
    );
    this.validator.addRule(
      "output",
      new RequiredRule("Output directory is required"),
    );
    this.validator.addRule("baseUrl", new RequiredRule("Base URL is required"));

    // String validations
    this.validator.addRule(
      "title",
      new StringRule({ minLength: 1, maxLength: 200 }),
    );
    this.validator.addRule(
      "description",
      new StringRule({ minLength: 1, maxLength: 500 }),
    );

    // Number validations
    this.validator.addRule(
      "build.concurrency",
      new NumberRule({ min: 1, max: 100, integer: true }),
    );
    this.validator.addRule(
      "build.timeout",
      new NumberRule({ min: 1000, max: 300000 }),
    );
  }

  validate(config: any): ValidationResult {
    return this.validator.validate(config);
  }
}

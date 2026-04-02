/**
 * Response sanitization
 * Removes sensitive fields before sending responses
 */

/**
 * Fields that should never be exposed in API responses
 */
const SENSITIVE_FIELDS = [
  "password",
  "failedLoginAttempts",
  "lockedUntil",
  "lastLoginIp",
  "encryptedPhone",
  "encryptedAddress",
  "totp_secret",
  "api_key",
  "secret_key",
];

/**
 * Sanitize user response
 * Remove sensitive user fields
 */
export function sanitizeUserResponse(user: any): any {
  if (!user) {
    return user;
  }

  const sanitized = { ...user };

  // Remove sensitive fields
  SENSITIVE_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
}

/**
 * Sanitize array of users
 */
export function sanitizeUsersResponse(users: any[]): any[] {
  return users.map((user) => sanitizeUserResponse(user));
}

/**
 * Sanitize employee response
 */
export function sanitizeEmployeeResponse(employee: any): any {
  if (!employee) {
    return employee;
  }

  const sanitized = { ...employee };

  // Remove user sensitive fields if nested
  if (sanitized.user) {
    sanitized.user = sanitizeUserResponse(sanitized.user);
  }

  return sanitized;
}

/**
 * Sanitize array of employees
 */
export function sanitizeEmployeesResponse(employees: any[]): any[] {
  return employees.map((employee) => sanitizeEmployeeResponse(employee));
}

/**
 * Generic sanitization function
 * Can be used for any object
 */
export function sanitizeResponse(
  data: any,
  fieldsToRemove: string[] = SENSITIVE_FIELDS
): any {
  if (!data) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponse(item, fieldsToRemove));
  }

  // Handle objects
  if (typeof data === "object") {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (!fieldsToRemove.includes(key)) {
        // Recursively sanitize nested objects
        if (typeof value === "object" && value !== null) {
          sanitized[key] = sanitizeResponse(value, fieldsToRemove);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Create safe API response object
 */
export function createSafeResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  code?: string
): {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
} {
  const response: any = { success };

  if (data !== undefined) {
    response.data = sanitizeResponse(data);
  }

  if (message) {
    response.message = message;
  }

  if (code) {
    response.code = code;
  }

  return response;
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  code: string = "ERROR",
  details?: any
): {
  success: boolean;
  message: string;
  code: string;
  details?: any;
} {
  const response: any = {
    success: false,
    message,
    code,
  };

  // Only include details in development
  if (process.env.NODE_ENV === "development" && details) {
    response.details = details;
  }

  return response;
}

/**
 * Check if field should be exposed
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.includes(fieldName);
}

/**
 * Add field to sensitive list
 */
export function addSensitiveField(fieldName: string): void {
  if (!SENSITIVE_FIELDS.includes(fieldName)) {
    SENSITIVE_FIELDS.push(fieldName);
  }
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (!data) {
    return data;
  }

  if (typeof data === "string") {
    if (data.length <= 4) {
      return "***";
    }
    return data.substring(0, 4) + "***";
  }

  if (typeof data === "object") {
    const masked: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        masked[key] = maskSensitiveData(value);
      } else if (typeof value === "object" && value !== null) {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  return data;
}

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

class ResourceNotFoundException extends AppError {
  constructor(message) {
    super(message, 404);
  }
  static of(resource, field, value) {
    return new ResourceNotFoundException(`${resource} not found with ${field}: '${value}'`);
  }
}

class BadRequestException extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class DuplicateResourceException extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

class UnauthorizedActionException extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

class BadCredentialsException extends AppError {
  constructor(message = 'Invalid email or password.') {
    super(message, 401);
  }
}

class ValidationException extends AppError {
  constructor(fieldErrors) {
    super('Validation failed for one or more fields.', 400);
    this.fieldErrors = fieldErrors;
  }
}

module.exports = {
  AppError,
  ResourceNotFoundException,
  BadRequestException,
  DuplicateResourceException,
  UnauthorizedActionException,
  BadCredentialsException,
  ValidationException,
};

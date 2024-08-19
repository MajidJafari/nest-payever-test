import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class CustomValidationPipe extends ValidationPipe {
  protected flattenValidationErrors(validationErrors: ValidationError[]) {
    return validationErrors.map((error) =>
      Object.values(error.constraints || {}).join(', '),
    );
  }

  public createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      const errors = this.flattenValidationErrors(validationErrors);
      return new UnprocessableEntityException({
        error: 'Validation failed',
        message: errors,
      });
    };
  }
}

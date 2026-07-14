import Joi from 'joi';
import { emailField } from './emailField';

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
  email: emailField(),
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
    }),
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
  email: emailField(),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});


/**
 * Validation schema for change password
 */
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Old password is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 100 characters',
      'any.required': 'New password is required',
    }),
});


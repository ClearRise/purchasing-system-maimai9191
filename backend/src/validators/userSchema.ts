import Joi from 'joi';
import { emailField } from './emailField';

/**
 * Validation schema for creating a new user
 */
export const createUserSchema = Joi.object({
  email: emailField()
    .lowercase()
    .max(255)
    .messages({
      'string.empty': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 100 characters',
      'string.empty': 'First name is required',
      'any.required': 'First name is required',
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 100 characters',
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
});

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 100 characters',
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 100 characters',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validation schema for pagination query parameters
 */
export const fetchUsersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than 0',
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  
  search: Joi.string()
    .allow('')
    .optional()
    .trim()
    .max(255)
    .messages({
      'string.max': 'Search term must not exceed 255 characters',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
  
  sortBy: Joi.string()
    .optional()
    .valid('id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLogin')
    .default('createdAt')
    .messages({
      'any.only': 'sortBy must be one of: id, email, firstName, lastName, createdAt, updatedAt, lastLogin',
    }),
  
  sortOrder: Joi.string()
    .optional()
    .valid('ASC', 'DESC')
    .uppercase()
    .default('DESC')
    .messages({
      'any.only': 'sortOrder must be either ASC or DESC',
    }),
});
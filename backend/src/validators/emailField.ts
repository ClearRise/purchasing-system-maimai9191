import Joi from 'joi';

/** Allows internal domains such as admin@kaniwa.local (Joi rejects unknown TLDs by default). */
export const emailField = (required = true) => {
  let schema = Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
    });

  if (required) {
    schema = schema.required().messages({
      'any.required': 'Email is required',
    });
  }

  return schema;
};

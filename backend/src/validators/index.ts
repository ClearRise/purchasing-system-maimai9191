import Joi from 'joi';

export * from './authSchema';
export * from './emailField';
export * from './userSchema';

/**
 * Global
 */
const idSchema = Joi.object({
    id: Joi.number().required(),
});

export {
    idSchema
}
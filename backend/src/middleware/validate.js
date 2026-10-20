/**
 * Validate request body against a Yup schema.
 * On success, replaces req.body with the cast/stripped value.
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    next();
  } catch (err) {
    err.name = 'ValidationError';
    err.statusCode = 400;
    next(err);
  }
};

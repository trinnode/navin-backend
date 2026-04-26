import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler.js';
import { validate } from '../../shared/validation/validate.js';
import { CreateUserBodySchema } from './users.validation.js';
import { createUserController, deleteUserController } from './users.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';
import { requireRole } from '../../shared/middleware/requireRole.js';

export const usersRouter = Router();

usersRouter.post('/', validate({ body: CreateUserBodySchema }), asyncHandler(createUserController));
usersRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(deleteUserController)
);

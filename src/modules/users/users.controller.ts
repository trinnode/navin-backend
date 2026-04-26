import type { RequestHandler } from 'express';
import { registerUser, deleteUser } from './users.service.js';

export const createUserController: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body);
  sendResponse(res, 201, true, 'User registered successfully', user);
};

export const deleteUserController: RequestHandler = async (req, res) => {
  await deleteUser(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
};

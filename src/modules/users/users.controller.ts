import type { RequestHandler } from 'express';
import { registerUser, deleteUser } from './users.service.js';

export const createUserController: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body);
  res.status(201).json({ data: user });
};

export const deleteUserController: RequestHandler = async (req, res) => {
  await deleteUser(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
};

import { AppError } from '../../shared/http/errors.js';
import { createUser, findUserByEmail } from './users.repo.js';
import { UserModel } from './users.model.js';

export async function registerUser(input: { email: string; name: string }) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new AppError(409, 'Email already in use', 'EMAIL_TAKEN');
  return createUser(input);
}

export async function deleteUser(id: string) {
  const user = await UserModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
}

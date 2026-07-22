import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  mustChangePassword: boolean;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}

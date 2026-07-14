import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}

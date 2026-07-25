import { Request } from 'express';
import { Socket } from 'socket.io';

// payload at validate jwt
export interface JwtPayload {
  sub: string;
  userName: string;
}

// data user after validate
export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  mustChangePassword: boolean;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}

export interface AuthenticatedSocket extends Socket {
  user: AuthUser;
}

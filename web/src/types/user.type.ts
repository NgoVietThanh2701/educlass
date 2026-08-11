import { RoleUser } from "./role.type";

export interface User {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  role: RoleUser;
  balance: number;
  createdAt: Date;
}

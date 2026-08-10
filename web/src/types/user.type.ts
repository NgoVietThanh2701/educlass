import { RoleUser } from "./role.type";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: RoleUser;
}

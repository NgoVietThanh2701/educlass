import { RoleUser } from "@/types/role.type";

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  role: RoleUser;
}

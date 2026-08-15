import type { User } from "@/types/user.type";

export interface DataAuthResponse {
  accessToken: string;
  user: User;
}

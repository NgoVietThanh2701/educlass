import axios from "axios";
import {
  setupRequestInterceptor,
  setupResponseInterceptor,
} from "./interceptors";

export const axiosInstance = axios.create({
  // Same-origin API path — proxied to the real backend by `next.config.ts`
  // (`/api/v1/:path*` → `API_ORIGIN`). Keeping API calls same-origin ensures the
  // httpOnly refresh-token cookie (SameSite=Strict) is ALWAYS sent with
  // `/auth/refresh`, so sessions survive a full page reload (F5) — regardless of
  // whether the app is opened via `localhost` or a LAN IP.
  baseURL: "/api/v1",
  withCredentials: true,
  // NOTE: No global `Content-Type` default. Axios detects it per request:
  // plain objects get `application/json`, while `FormData` (multipart uploads
  // like course thumbnails / lesson attachments) must be sent as-is so the
  // browser sets `multipart/form-data; boundary=...`. Forcing
  // `application/json` here would make axios JSON-serialize the FormData
  // (turning the file into `{}`) and the backend would never receive the file.
});

setupRequestInterceptor(axiosInstance);
setupResponseInterceptor(axiosInstance);

import axios from "axios";
import {
  setupRequestInterceptor,
  setupResponseInterceptor,
} from "./interceptors";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

setupRequestInterceptor(axiosInstance);
setupResponseInterceptor(axiosInstance);

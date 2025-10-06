// utils/api.ts
import { getCookie } from "cookies-next";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getCookie("token");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}

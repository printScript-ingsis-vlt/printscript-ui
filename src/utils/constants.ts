export const FRONTEND_URL = process?.env?.FRONTEND_URL ?? "http://localhost:5173"
// The browser always talks to the API through the same-origin `/api` prefix.
// Vite proxies this prefix locally; Nginx proxies it in deployed environments.
export const BACKEND_URL = "/api"
export const AUTH0_USERNAME = process?.env?.AUTH0_USERNAME ?? ""
export const AUTH0_PASSWORD = process?.env?.AUTH0_PASSWORD ?? ""

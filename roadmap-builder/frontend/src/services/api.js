// Simple fetch wrapper. All requests go to /api/* which Vite proxies
// to the Express backend in development, and which Vercel routes to
// the serverless function in production.
async function request(path, options = {}) {
  const token = localStorage.getItem("rb_token");

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { method: "POST", body: JSON.stringify(body), ...opts }),
  patch: (path, body, opts) => request(path, { method: "PATCH", body: JSON.stringify(body), ...opts }),
  delete: (path, opts) => request(path, { method: "DELETE", ...opts }),
};

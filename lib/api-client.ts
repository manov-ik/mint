export const API_URL = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "/api");

export function useApi() {
  const fetchApi = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return fetch(`${API_URL}${cleanPath}`, {
      ...options,
      headers,
    });
  };

  return { fetchApi };
}

import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

if (!configuredBaseUrl && import.meta.env.DEV) {
  console.warn("[api] VITE_API_BASE_URL is not set — API calls may fail.");
}

const API = axios.create({
  baseURL: configuredBaseUrl.replace(/\/+$/, ""),
});

API.interceptors.request.use(
  (config) => {
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      const normalized = config.url.startsWith("/") ? config.url : `/${config.url}`;
      const isApiPath = normalized.startsWith("/api/");
      const isMediaOrStaticPath = normalized.startsWith("/media/") || normalized.startsWith("/static/");
      config.url = (isApiPath || isMediaOrStaticPath) ? normalized : `/api${normalized}`;
    }

    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Authorization header set for ${config.url}`);
    } else {
      console.warn(`[API] No access_token found in localStorage for ${config.url}. Request may fail with 401.`);
      console.log("[API] Available localStorage keys:", Object.keys(localStorage));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || "");
      const isApiRequest = requestUrl.includes("/api/");
      const isBlobResponse = error.config?.responseType === "blob";

      console.error("[API] 401 Unauthorized - request:", requestUrl);

      if (isBlobResponse && error.response?.data instanceof Blob) {
        try {
          const blobText = await error.response.data.text();
          console.error("[API] Blob error payload:", blobText);
        } catch {
          console.error("[API] Response:", error.response.data);
        }
      } else {
        console.error("[API] Response:", error.response.data);
      }

      // Clear token only for authenticated API endpoints; avoid clearing on media/static failures.
      if (isApiRequest) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
      }
    }
    return Promise.reject(error);
  }
);

export default API;

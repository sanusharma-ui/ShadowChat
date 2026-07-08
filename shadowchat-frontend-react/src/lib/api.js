// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json"
//   }
// });

// let tokenGetter = null;

// export function setTokenGetter(getter) {
//   tokenGetter = getter;
// }

// api.interceptors.request.use(async (config) => {
//   if (tokenGetter) {
//     const token = await tokenGetter();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message =
//       error?.response?.data?.message ||
//       error?.response?.data?.error ||
//       error?.message ||
//       "Request failed";

//     return Promise.reject(new Error(message));
//   }
// );

// export default api;

// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: "application/json"
  }
});

let tokenGetter = null;

export function setTokenGetter(getter) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  // Set JSON header only for non-FormData requests
  const isForm = typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isForm && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  if (isForm) {
    // Let the browser/axios set the correct multipart boundary
    delete config.headers["Content-Type"];
  }

  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

export default api;

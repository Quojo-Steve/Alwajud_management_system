import axios from "axios";
const Url = import.meta.env.VITE_ROUTE;

const api = axios.create({
  baseURL: Url,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosService = async (method, url, data = null, options = {}) => {
  try {
    const config = {
      method,
      url,
      headers: {},
      ...options,
    };

    // Handle request body vs query params
    if (["get", "delete"].includes(method.toLowerCase())) {
      config.params = data; // GET/DELETE use query params
    } else {
      config.data = data;   // POST/PUT/PATCH use body
    }

    // Set Content-Type
    if (data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = options.contentType || "application/json";
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error(`API Error [${method.toUpperCase()} ${url}]:`, error);
    throw error;
  }
};
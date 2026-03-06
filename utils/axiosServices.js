import axios from "axios";
const Url = import.meta.env.VITE_ROUTE;

const api = axios.create({
  baseURL: Url,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const localUser = localStorage.getItem("user");
    const initialUser = localUser ? JSON.parse(localUser) : [];
    const token = initialUser?.accessToken || "";

    if (token) {
      // Attach the token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle error
    return Promise.reject(error);
  }
);

export const axiosService = async (method, url, data = {}, options = {}) => {
  try {
    // Determine Content-Type dynamically
    let headers = {};
    if (options.contentType) {
      headers["Content-Type"] = options.contentType;
    } else if (data instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    } else {
      headers["Content-Type"] = "application/json";
    }

    const response = await api({
      method,
      url,
      data,
      headers: {
        ...headers, // Override or add additional headers
      },
    });
    return response; // Return response data directly
  } catch (error) {
    // Handle error (could log, throw, or return an error response)
    console.error("API Error:", error);
    if (error?.response?.data?.error == 0) {
      console.log("Token Expired");
      localStorage.setItem("user", JSON.stringify(null));
      window.location.assign("/")
    }
    throw error;
  }
};


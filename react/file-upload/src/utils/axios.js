import axios from "axios";

const Axios = axios.create({
  validateStatus(status) {
    return status >= 200 && status < 400;
  },
  baseURL: "http://localhost:3000",
});

Axios.interceptors.request.use(
  async (config) => {
    let token = "";
    token = localStorage.TYFILE_TOKEN ? `Bearer ${localStorage.TYFILE_TOKEN}` : "";
    config.headers.authorization = token;
    config.headers["Content-Type"] = "application/json";
    config.headers["ngrok-skip-browser-warning"] = "any";
    return config;
  },
  (error) => {
    console.error("axios.request.error", error);
    throw error;
  }
);

export default Axios;

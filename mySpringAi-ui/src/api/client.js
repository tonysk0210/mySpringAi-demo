import axios from "axios";

// 不固定 Content-Type：讓 Axios／瀏覽器依 request body 自動處理，
// 例如一般 object 使用 application/json，FormData 使用帶 boundary 的 multipart/form-data。
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 120000,
});

export default apiClient;

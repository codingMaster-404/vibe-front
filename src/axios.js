import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 필요한 경우 공통 에러 처리 위치
    return Promise.reject(error)
  },
)

export default api


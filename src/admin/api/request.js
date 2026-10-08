import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * 管理端 Axios 实例：与用户端相同的拦截逻辑，但使用独立的
 * localStorage key（admin_token），避免与用户端登录态互相覆盖。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// ---------- 请求拦截器：携带管理员 token ----------
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------- 响应拦截器 ----------
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    // 管理员登录态失效：清理本地并跳转管理端登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
    }
    const message = error.response?.data?.message || '网络异常，请稍后重试'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request

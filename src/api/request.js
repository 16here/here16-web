import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * Axios 实例：统一处理 token 注入、业务错误提示、401 跳转。
 *
 * 约定：
 * - 后端统一返回 { code, message, data, timestamp }，code === 200 视为成功；
 * - 后端未认证时返回 HTTP 401 + JSON，这里统一清除登录态并跳转登录页。
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// ---------- 请求拦截器：自动携带 JWT token ----------
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mall_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------- 响应拦截器：统一处理业务码与登录态失效 ----------
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务失败（HTTP 200 但 code != 200，如参数错误、用户名已存在）
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    // HTTP 401：token 过期或未登录
    if (error.response && error.response.status === 401) {
      // 清理本地登录态
      localStorage.removeItem('mall_token')
      localStorage.removeItem('mall_user')
      // 跳转登录页（记录来源，登录后跳回）
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    const message = error.response?.data?.message || '网络异常，请稍后重试'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request

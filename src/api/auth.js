import request from './request'

/**
 * 认证相关接口封装。
 * 后端路径 /api/auth/**（开发环境经 Vite 代理转发）。
 */

/** 登录：account 支持用户名或手机号（Phase 1：需先获取图形验证码） */
export function login(data) {
  return request.post('/auth/login', data)
}

/** 获取登录图形验证码（Phase 1：返回 { captchaId, imageBase64 }，登录时携带 captchaId + 用户输入） */
export function getCaptcha() {
  return request.get('/auth/captcha')
}

/** 注册 */
export function register(data) {
  return request.post('/auth/register', data)
}

/** 获取当前登录用户信息（刷新页面后恢复登录态用） */
export function getUserInfo() {
  return request.get('/auth/me')
}

/** 登出 */
export function logout() {
  return request.post('/auth/logout')
}

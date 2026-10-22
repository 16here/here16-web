import request from './request'

/**
 * 管理端认证接口封装。
 *
 * 说明：阶段 1 后端尚未提供独立的 /api/admin/auth/login 管理端认证接口，
 * 但 /api/admin/** 接口当前只要求"已登录"（任意有效 token）。
 * 因此管理端登录临时复用用户端 POST /api/auth/login 换取 token；
 * 管理端专属认证（管理员账号 + ROLE_ADMIN 角色）将在后续阶段实现后切换回独立接口。
 */

/** 管理员登录（阶段 1：复用用户登录接口；Phase 1：需先获取图形验证码） */
export function adminLogin(data) {
  return request.post('/auth/login', data)
}

/** 获取登录图形验证码（Phase 1：返回 { captchaId, imageBase64 }） */
export function getCaptcha() {
  return request.get('/auth/captcha')
}

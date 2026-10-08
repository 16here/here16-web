import request from './request'

/**
 * 管理端优惠券接口封装（阶段 8，对应后端 /api/admin/coupons，仅 ADMIN）。
 * 提供：模板 CRUD + 上下架（status 字段）+ 按手机号定向发放。
 */

/** 模板分页列表 */
export function getAdminCoupons(params) {
  return request.get('/admin/coupons', { params })
}

/** 新增模板 */
export function createCoupon(data) {
  return request.post('/admin/coupons', data)
}

/** 更新模板（全量） */
export function updateCoupon(id, data) {
  return request.put(`/admin/coupons/${id}`, data)
}

/** 删除模板 */
export function deleteCoupon(id) {
  return request.delete(`/admin/coupons/${id}`)
}

/** 定向发放：body { phone, quantity } → 返回 { issued } */
export function issueCoupon(id, phone, quantity) {
  return request.post(`/admin/coupons/${id}/issue`, { phone, quantity })
}

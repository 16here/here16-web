import request from './request'

/**
 * 管理端营销活动接口封装（阶段 8，对应后端 /api/admin/promotions，仅 ADMIN）。
 * 提供：活动 CRUD + 启用/停用。
 */

/** 活动分页列表 */
export function getAdminPromotions(params) {
  return request.get('/admin/promotions', { params })
}

/** 新增活动（type：1=满减 2=折扣 3=秒杀） */
export function createPromotion(data) {
  return request.post('/admin/promotions', data)
}

/** 更新活动（全量） */
export function updatePromotion(id, data) {
  return request.put(`/admin/promotions/${id}`, data)
}

/** 删除活动 */
export function deletePromotion(id) {
  return request.delete(`/admin/promotions/${id}`)
}

/** 启用/停用：status=1 启用，0 停用 */
export function updatePromotionStatus(id, status) {
  return request.put(`/admin/promotions/${id}/status`, { status })
}

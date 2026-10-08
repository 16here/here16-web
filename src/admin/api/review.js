import request from './request'

/**
 * 管理端评价接口封装（/api/admin/reviews，仅 ADMIN，阶段 7）。
 */
/** 评价分页（?status=&page=&pageSize=，status 空=全部） */
export const listReviews = (params) => request.get('/admin/reviews', { params })

/** 审核评价：status=1 通过（发布），status=2 隐藏（query 传参） */
export const auditReview = (id, status) =>
  request.post(`/admin/reviews/${id}/audit`, null, { params: { status } })

/** 商家回复（body: { reply }） */
export const replyReview = (id, reply) =>
  request.post(`/admin/reviews/${id}/reply`, { reply })

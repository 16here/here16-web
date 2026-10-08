import request from './request'

/**
 * 管理端售后接口封装（/api/admin/after-sales，仅 ADMIN，阶段 7）。
 */
/** 售后分页（?type=&status=&page=&pageSize=） */
export const listAfterSales = (params) => request.get('/admin/after-sales', { params })

/** 售后详情（含订单商品明细） */
export const getAfterSaleDetail = (id) => request.get(`/admin/after-sales/${id}`)

/** 审核售后（body: { approve, remark }；仅退款通过→直接退款，退货退款通过→待寄回） */
export const auditAfterSale = (id, approve, remark) =>
  request.post(`/admin/after-sales/${id}/audit`, { approve, remark })

/** 确认收货退款（退货退款链路：待寄回 → 已完成） */
export const confirmRefund = (id) => request.post(`/admin/after-sales/${id}/refund`)

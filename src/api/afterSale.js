import request from './request'

/**
 * 售后接口封装（阶段 7，需登录）。
 *
 * - POST /after-sales：申请售后（仅退款 / 退货退款，金额 ≤ 订单实付）；
 * - GET /after-sales：我的售后列表（?status=&page=&pageSize=）；
 * - GET /after-sales/{id}：售后详情（含订单商品明细）；
 * - POST /after-sales/{id}/cancel：撤销申请（仅待审核可撤销）；
 * - POST /after-sales/{id}/logistics：填写退货物流单号（仅待寄回可填，query 传参）。
 */
/** 申请售后（body: { orderId, type, reason, amount }） */
export const applyAfterSale = (data) => request.post('/after-sales', data)

/** 我的售后列表 */
export const getAfterSales = (params) => request.get('/after-sales', { params })

/** 售后详情 */
export const getAfterSaleDetail = (id) => request.get(`/after-sales/${id}`)

/** 撤销售后申请 */
export const cancelAfterSale = (id) => request.post(`/after-sales/${id}/cancel`)

/** 填写退货物流单号（query 参数，与后端 @RequestParam 对应） */
export const fillLogistics = (id, logisticsNo) =>
  request.post(`/after-sales/${id}/logistics`, null, { params: { logisticsNo } })

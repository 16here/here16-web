import request from './request'

/**
 * 管理端订单接口封装（/api/admin/orders）。
 */
/** 订单列表（?status=&keyword=&page=&pageSize=，支持状态筛选与订单号搜索） */
export const getOrders = (params) => request.get('/admin/orders', { params })

/** 订单详情（含明细与下单人） */
export const getOrderDetail = (id) => request.get(`/admin/orders/${id}`)

/** 发货（阶段 5：发货弹窗填写物流单号，仅待发货订单可发货） */
export const shipOrder = (id, shippingNo) =>
  request.post(`/admin/orders/${id}/ship`, null, { params: { shippingNo } })

/** 关闭订单（阶段 5：仅待付款订单可关闭，恢复库存） */
export const closeOrder = (id) => request.post(`/admin/orders/${id}/close`)

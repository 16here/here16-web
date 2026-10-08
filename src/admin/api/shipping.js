import request from './request'

/**
 * 管理端物流接口封装（/api/admin/shipping，阶段 9）。
 */
/** 发货（POST /api/admin/shipping/ship，body：{orderId, shippingCompany, trackingNo}） */
export const shipShipping = (data) => request.post('/admin/shipping/ship', data)

/** 运单列表（?status=&page=&pageSize=，状态筛选） */
export const getShippingList = (params) => request.get('/admin/shipping', { params })

/** 运单详情（含轨迹时间轴） */
export const getShippingDetail = (id) => request.get(`/admin/shipping/${id}`)

/** 手动同步物流轨迹（POST /api/admin/shipping/{id}/sync） */
export const syncShippingTrace = (id) => request.post(`/admin/shipping/${id}/sync`)

import request from './request'

/**
 * 用户端物流接口封装（阶段 9：物流跟踪）。
 */
/** 查看订单物流（GET /api/shipping/{orderId}）：运单信息 + 轨迹时间轴 */
export const getShipping = (orderId) => request.get(`/shipping/${orderId}`)

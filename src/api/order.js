import request from './request'

/**
 * 订单接口封装（需登录，request 拦截器自动带 token）。
 */
/** 创建订单（传 addressId + 勾选的 cartIds + 备注；价格/库存以后端为准） */
export const createOrder = (data) => request.post('/orders', data)

/** 我的订单列表（?status=&page=&pageSize=） */
export const getOrders = (params) => request.get('/orders', { params })

/** 订单详情 */
export const getOrderDetail = (id) => request.get(`/orders/${id}`)

/** 取消订单（仅待付款/待发货可取消） */
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)

/** 确认收货（仅待收货可确认 → 已完成；阶段 5 接入状态机） */
export const confirmOrder = (id) => request.post(`/orders/${id}/confirm`)

import request from './request'

/**
 * 订单接口封装（需登录，request 拦截器自动带 token）。
 */

/** 生成一次性幂等键（Phase 1：每次提交订单生成新 UUID，后端 Redis 去重防双击） */
function newRequestId() {
  // 浏览器原生 crypto.randomUUID()（现代浏览器均支持），失败则退化为随机串
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }
  return 'r' + Date.now() + '-' + Math.random().toString(36).slice(2)
}

/**
 * 创建订单（传 addressId + 勾选的 cartIds + 备注；价格/库存以后端为准）。
 * Phase 1：自动注入 requestId 幂等键——同一请求重复提交（双击/网络重试）
 * 后端会拒绝第二次，防止重复下单。
 */
export const createOrder = (data) => request.post('/orders', { ...data, requestId: newRequestId() })

/** 我的订单列表（?status=&page=&pageSize=） */
export const getOrders = (params) => request.get('/orders', { params })

/** 订单详情 */
export const getOrderDetail = (id) => request.get(`/orders/${id}`)

/** 取消订单（仅待付款/待发货可取消） */
export const cancelOrder = (id) => request.post(`/orders/${id}/cancel`)

/** 确认收货（仅待收货可确认 → 已完成；阶段 5 接入状态机） */
export const confirmOrder = (id) => request.post(`/orders/${id}/confirm`)

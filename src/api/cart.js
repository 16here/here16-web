import request from './request'

/**
 * 购物车接口封装。
 *
 * 约定：所有接口都会自动携带 token（request 拦截器注入 Authorization），
 * 后端返回统一 { code, message, data, timestamp }。
 */
/** 查询购物车（明细 + 总件数 + 总金额） */
export const getCart = () => request.get('/cart')

/** 添加购物车；同一商品+规格重复添加时后端自动合并数量 */
export const addToCart = (data) => request.post('/cart', data)

/** 更新数量 */
export const updateCart = (id, data) => request.put(`/cart/${id}`, data)

/** 删除单项 */
export const removeFromCart = (id) => request.delete(`/cart/${id}`)

/** 清空购物车 */
export const clearCart = () => request.delete('/cart')

/** 登录合并：把游客本地购物车批量提交给后端 */
export const mergeCart = (items) => request.post('/cart/merge', items)

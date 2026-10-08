import request from './request'

/**
 * 收藏接口封装（用户端，需登录）。
 * 后端路径 /api/favorites，baseURL 已含 /api，此处不加前缀。
 */

/** 收藏夹列表（最新收藏在前，含商品信息+主图） */
export function getFavorites() {
  return request.get('/favorites')
}

/** 收藏商品（幂等） */
export function addFavorite(productId) {
  return request.post(`/favorites/${productId}`)
}

/** 取消收藏（幂等） */
export function removeFavorite(productId) {
  return request.delete(`/favorites/${productId}`)
}

/** 是否已收藏（商品详情页收藏按钮初始状态） */
export function getFavoriteStatus(productId) {
  return request.get(`/favorites/${productId}/status`)
}

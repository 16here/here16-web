import request from './request'

/**
 * 推荐接口（阶段 10）。
 * 说明：request 的 baseURL 已包含 /api，此处路径省略前缀。
 * 未登录访问首页推荐位时后端返回"热门推荐"（热度算法）；
 * 已登录时返回"猜你喜欢"（个性化，协同过滤 + 分类/热度兜底）。
 */

/** 首页推荐位：登录=猜你喜欢，未登录=热门推荐；limit<=0 用后端默认数量 */
export function getHomeRecommend(limit = 0) {
  return request.get('/recommend/home', { params: { limit } })
}

/** 商品详情"相关推荐"（看过此商品的用户还看了） */
export function getProductRecommend(productId, limit = 0) {
  return request.get(`/recommend/product/${productId}`, { params: { limit } })
}

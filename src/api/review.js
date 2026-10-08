import request from './request'

/**
 * 评价接口封装（阶段 7）。
 *
 * - POST /reviews：发表评价（需登录，仅已完成订单，一订单明细一评价）；
 * - GET /reviews/product/{id}：商品评价列表（公开，只返回已发布）；
 * - GET /reviews/product/{id}/stats：商品评分统计（公开）。
 */
/** 发表评价（body: { orderId, orderItemId, rating, content, images }） */
export const submitReview = (data) => request.post('/reviews', data)

/** 商品评价列表（?page=&pageSize=，只含已发布评价） */
export const getProductReviews = (productId, params) =>
  request.get(`/reviews/product/${productId}`, { params })

/** 商品评分统计（avgRating / totalCount / five~one / fivePercent） */
export const getReviewStats = (productId) =>
  request.get(`/reviews/product/${productId}/stats`)

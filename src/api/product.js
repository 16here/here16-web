import request from './request'

/**
 * 商品与分类接口封装（用户端）。
 * 后端路径 /api/products、/api/categories（开发环境经 Vite 代理转发）。
 */

/** 商品分页：keyword 关键词、categoryId 分类、sortBy 排序、page/pageSize */
export function getProducts(params) {
  return request.get('/products', { params })
}

/** 商品详情（含图片与规格） */
export function getProductDetail(id) {
  return request.get(`/products/${id}`)
}

/** 分类树（顶级分类含子分类） */
export function getCategories() {
  return request.get('/categories')
}

/** SKU 实时可卖库存（阶段 6：商品详情页轮询展示"实时库存"） */
export function getSkuStock(skuId) {
  return request.get(`/skus/${skuId}/stock`)
}

/** 商品级实时可卖库存（无规格商品，阶段 6） */
export function getProductStock(productId) {
  return request.get(`/products/${productId}/stock`)
}

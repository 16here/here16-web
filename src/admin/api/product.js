import request from './request'

/**
 * 管理端商品接口封装（对应后端 /api/admin/products）。
 */

/** 商品分页（含下架商品；keyword/categoryId/sortBy/page/pageSize） */
export function getAdminProducts(params) {
  return request.get('/admin/products', { params })
}

/** 新增商品 */
export function createProduct(data) {
  return request.post('/admin/products', data)
}

/** 更新商品（全量） */
export function updateProduct(id, data) {
  return request.put(`/admin/products/${id}`, data)
}

/** 删除商品 */
export function deleteProduct(id) {
  return request.delete(`/admin/products/${id}`)
}

/** 上下架：status=1 上架，0 下架 */
export function updateProductStatus(id, status) {
  return request.put(`/admin/products/${id}/status`, { status })
}

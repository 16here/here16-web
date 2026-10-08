import request from './request'

/**
 * 管理端分类接口封装（对应后端 /api/admin/categories）。
 */

/** 平铺分类列表（含全部层级） */
export function getAdminCategories() {
  return request.get('/admin/categories')
}

/** 新增分类（顶级或子分类） */
export function createCategory(data) {
  return request.post('/admin/categories', data)
}

/** 更新分类 */
export function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, data)
}

/** 删除分类（有子分类或商品时后端会拒绝） */
export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

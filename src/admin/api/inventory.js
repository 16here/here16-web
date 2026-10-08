import request from './request'

/**
 * 管理端库存接口封装（对应后端 /api/admin/inventory，阶段 6）。
 */

/** 库存列表：SKU 逐行 + 无规格商品一行（含锁定库存与可卖库存） */
export function getInventorySkus() {
  return request.get('/admin/inventory/skus')
}

/** 调整库存：{ skuId(0=商品级), productId, delta, remark }，delta 可正可负 */
export function adjustStock(data) {
  return request.post('/admin/inventory/adjust', data)
}

/** 库存流水查询（分页）：skuId 必传（0=商品级，需配合 productId） */
export function getStockLogs(params) {
  return request.get('/admin/inventory/logs', { params })
}

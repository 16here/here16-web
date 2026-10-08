import request from './request'

/**
 * 收货地址接口封装（需登录，request 拦截器自动带 token）。
 */
/** 地址列表（默认排最前） */
export const getAddresses = () => request.get('/addresses')

/** 新增地址（首个自动设为默认） */
export const createAddress = (data) => request.post('/addresses', data)

/** 修改地址 */
export const updateAddress = (id, data) => request.put(`/addresses/${id}`, data)

/** 删除地址 */
export const deleteAddress = (id) => request.delete(`/addresses/${id}`)

/** 设为默认地址 */
export const setDefaultAddress = (id) => request.put(`/addresses/${id}/default`)

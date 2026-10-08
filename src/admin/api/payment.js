import request from './request'

/**
 * 管理端支付流水接口封装（/api/admin/payments，对账用）。
 */
/** 支付流水分页（?payMethod=&status=&keyword=&page=&pageSize=） */
export const getPayments = (params) => request.get('/admin/payments', { params })

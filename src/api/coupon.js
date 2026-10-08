import request from './request'

/**
 * 优惠券接口封装（阶段 8）。
 *
 * 接口约定（与后端 CouponController 对应）：
 * - GET  /api/coupons/center           领券中心（公开，已登录返回按钮态 received）
 * - POST /api/coupons/{id}/receive     领取优惠券（需登录）
 * - GET  /api/coupons/mine?status=     我的优惠券（status：0 未使用 / 2 已使用 / 3 已过期）
 * - GET  /api/coupons/available?amount= 可用券列表（结算页按订单金额筛门槛）
 * - POST /api/coupons/preview?amount=  试算一张券的优惠金额（body: { userCouponId }）
 */

/** 领券中心列表 */
export const getCouponCenter = () => request.get('/coupons/center')

/** 领取优惠券 */
export const receiveCoupon = (couponId) => request.post(`/coupons/${couponId}/receive`)

/** 我的优惠券（statusTab 不传 = 全部） */
export const getMyCoupons = (params) => request.get('/coupons/mine', { params })

/** 可用券列表（按订单商品金额筛选门槛） */
export const getAvailableCoupons = (amount) => request.get('/coupons/available', { params: { amount } })

/** 试算优惠金额（amount 为订单商品金额，body 传 userCouponId） */
export const previewCoupon = (userCouponId, amount) =>
  request.post('/coupons/preview', { userCouponId }, { params: { amount } })

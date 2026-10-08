import request from './request'
import axios from 'axios'

/**
 * 支付接口封装。
 *
 * 说明：createPayment / queryPayment 需登录（拦截器自动带 token）；
 * mockCallback 模拟支付平台的异步回调（后端放行，无需登录），
 * 仅 mock 模式下由前端调用以走通"模拟扫码支付"闭环。
 *
 * 注意：回调接口按支付平台惯例返回纯文本 success/fail，
 * 不走统一 JSON 响应拦截器（{code,message,data}），因此这里用独立 axios 实例发起。
 */
/** 发起支付（orderId 在路径，body 传支付方式 payMethod: alipay/wechat） */
export const createPayment = (orderId, data) => request.post(`/pay/${orderId}`, data)

/** 查询支付状态（前端轮询 / 结果页展示） */
export const queryPayment = (paymentNo) => request.get('/pay/status', { params: { paymentNo } })

/**
 * 模拟支付平台回调（仅 mock 模式）。
 * 参数：paymentNo + amount + tradeNo(模拟交易号) + mockSign(后端签发的一次性签名)。
 * 以表单格式 POST，与真实支付平台回调一致；返回纯文本 success/fail。
 */
export const mockCallback = (payMethod, params) => {
  const form = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => form.append(k, v))
  return axios.post(`/api/pay/callback/${payMethod}`, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

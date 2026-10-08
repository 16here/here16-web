/**
 * 管理端：人工客服与工单接口（阶段 11.6）。
 * 走统一 request（自动带管理员 token）。
 */
import request from './request'

/** 客服列表 */
export function listAgents() {
  return request.get('/api/admin/agents')
}

/** 新增客服 { userId, maxConcurrent } */
export function createAgent(userId, maxConcurrent) {
  return request.post('/api/admin/agents', { userId, maxConcurrent })
}

/** 更新客服 { status?, maxConcurrent? }（上下线 / 调整并发） */
export function updateAgent(agentId, data) {
  return request.put(`/api/admin/agents/${agentId}`, data)
}

/** 删除客服 */
export function deleteAgent(agentId) {
  return request.delete(`/api/admin/agents/${agentId}`)
}

/** 会话列表（工作台左侧）：?status=WAITING_FOR_HUMAN|HUMAN|CLOSED */
export function listSessions(status) {
  return request.get('/api/admin/sessions', { params: { status } })
}

/** 会话详情（含消息流） */
export function getSessionDetail(sessionId) {
  return request.get(`/api/admin/sessions/${sessionId}`)
}

/** 接入排队会话（自动分配空闲客服） */
export function acceptSession(sessionId) {
  return request.post(`/api/admin/sessions/${sessionId}/accept`)
}

/** 手动转接（回排队重新分配） */
export function transferSession(sessionId) {
  return request.post(`/api/admin/sessions/${sessionId}/transfer`)
}

/** 客服回复 { content } */
export function replyMessage(sessionId, content) {
  return request.post(`/api/admin/sessions/${sessionId}/message`, { content })
}

/** 关闭会话 */
export function closeSession(sessionId) {
  return request.post(`/api/admin/sessions/${sessionId}/close`)
}

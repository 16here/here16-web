/**
 * 客服对话接口（阶段 11.5 / 11.6）：消费 Java /api/chat/message 的 SSE 流。
 *
 * 为什么不用 Axios：Axios 基于 XHR，XHR 不支持流式读取响应体
 * （responseText 只在请求结束后可用），无法实现"第一个字很快冒出来"。
 * 这里改用 fetch + ReadableStream：边收边解析 SSE 事件，逐字渲染。
 *
 * SSE 事件协议（Java 透传 Python，原样一致）：
 *   data: {"type":"status","content":"thinking"}        —— 开始思考（前端显示"正在输入"）
 *   data: {"type":"delta","content":"你"}               —— 逐字增量
 *   data: {"type":"done","response":"完整回复","handoff":false,"action":"transfer_to_human"} —— 结束
 *   data: {"type":"error","message":"..."}              —— 异常
 */

/** 登录 token 的本地存储键（与 request.js / store/user.js 保持一致） */
const TOKEN_KEY = 'mall_token'

/**
 * 发送一条客服消息。
 *
 * @param {string} message 消息内容
 * @param {Object} handlers 回调集合
 * @param {Function} [handlers.onStatus] 收到 status 事件（thinking）
 * @param {Function} [handlers.onDelta] 收到逐字增量（content）
 * @param {Function} [handlers.onDone] 收到 done 事件（{response, handoff}）
 * @param {Function} [handlers.onError] 收到 error 事件或网络错误（message）
 * @param {string} [handlers.type] AI=智能客服（默认），HUMAN=转人工
 */
export async function sendChatMessage(message, { onStatus, onDelta, onDone, onError, type = 'AI' } = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  let resp
  try {
    resp = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, type })
    })
  } catch (e) {
    onError?.('网络异常，请稍后重试')
    return
  }

  // ---------- 转人工分支：非流式，返回 Result JSON ----------
  if (type === 'HUMAN') {
    try {
      const data = await resp.json()
      if (data.code === 200) {
        onDone?.({ response: data.data?.message, handoff: true })
      } else {
        onError?.(data.message || '转人工失败，请稍后重试')
      }
    } catch (e) {
      onError?.('转人工失败，请稍后重试')
    }
    return
  }

  // ---------- AI 分支：流式消费 SSE ----------
  if (!resp.ok || !resp.body) {
    let msg = 'AI 客服服务暂时不可用'
    try {
      const data = await resp.json()
      msg = data.message || msg
    } catch (e) { /* 非 JSON 响应，用默认文案 */ }
    onError?.(msg)
    return
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  try {
    // 流式循环：每次读到的字节先进 buffer，再按 SSE 分隔符（空行 \n\n）切出完整事件
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let sepIdx
      while ((sepIdx = buffer.indexOf('\n\n')) >= 0) {
        const raw = buffer.slice(0, sepIdx)
        buffer = buffer.slice(sepIdx + 2)
        const line = raw.trim()
        // SSE 约定：事件行以 "data: " 开头
        if (!line.startsWith('data:')) continue
        let evt
        try {
          evt = JSON.parse(line.slice(5).trim())
        } catch (e) {
          continue // 半截 JSON 直接跳过（安全起见不渲染）
        }
        if (evt.type === 'status') onStatus?.(evt)
        else if (evt.type === 'delta') onDelta?.(evt.content)
        else if (evt.type === 'done') onDone?.(evt)
        else if (evt.type === 'error') onError?.(evt.message)
      }
    }
  } catch (e) {
    // 流中断（连接被后端异常切断 / 用户刷新等）：正常结束回调缺失时
    // 通知调用方，避免 UI 卡在"正在输入"
    onError?.('连接中断，请稍后重试')
  }
}

/**
 * 便捷方法：转人工（阶段 11.6 起走独立接口 /api/chat/transfer）。
 *
 * 返回 JSON：{ sessionId, status(WAITING_FOR_HUMAN|HUMAN), agentId, message }
 * 由调用方根据 status 决定 UI（排队中 / 客服已接入）。
 *
 * @param {string} message 用户留言（可选）
 * @returns {Promise<{sessionId:number,status:string,agentId:number|null,message:string}>}
 */
export async function transferToHuman(message = '需要人工客服') {
  const token = localStorage.getItem(TOKEN_KEY)
  const resp = await fetch('/api/chat/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message })
  })
  const data = await resp.json()
  if (data.code !== 200) {
    throw new Error(data.message || '转人工失败，请稍后重试')
  }
  return data.data
}

/**
 * 查询会话状态（阶段 11.6）：前端轮询用。
 *
 * @param {number} sessionId 会话 ID
 * @returns {Promise<{sessionId:number,status:string,type:string,agentName:string}>}
 */
export async function getChatStatus(sessionId) {
  const token = localStorage.getItem(TOKEN_KEY)
  const resp = await fetch(`/api/chat/status?sessionId=${sessionId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  const data = await resp.json()
  if (data.code !== 200) {
    throw new Error(data.message || '查询会话状态失败')
  }
  return data.data
}

/**
 * 人工模式下发送消息（阶段 11.6）：非流式，直接落库给客服看。
 *
 * @param {string} message 消息内容
 * @returns {Promise<string>} 后端提示文案
 */
export async function sendHumanMessage(message) {
  const token = localStorage.getItem(TOKEN_KEY)
  const resp = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, type: 'HUMAN' })
  })
  const data = await resp.json()
  if (data.code !== 200) {
    throw new Error(data.message || '发送失败，请稍后重试')
  }
  return data.data?.message || '已发送'
}

<template>
  <!-- 全局悬浮客服聊天窗（阶段 11.5/11.6）：右下角按钮 + 展开面板 -->
  <div class="chat-widget">
    <!-- 悬浮按钮（收起态）：客服图标 + 未读角标 -->
    <button v-if="!open" class="chat-float-btn" @click="open = true">
      <el-icon :size="22"><ChatDotRound /></el-icon>
      <span v-if="unread > 0" class="chat-badge">{{ unread > 99 ? '99+' : unread }}</span>
    </button>

    <!-- 展开面板 -->
    <div v-else class="chat-panel">
      <!-- 头部：标题随模式切换（智能客服 / 人工客服）+ 关闭 -->
      <div class="chat-header">
        <span class="chat-title">{{ handoff ? '人工客服' : '智能客服' }}</span>
        <el-icon class="chat-close" @click="open = false"><Close /></el-icon>
      </div>

      <!-- 消息区：AI 模式走原消息列表；转人工后切换为人工客服对话界面 -->
      <div v-if="!handoff" class="chat-messages">
        <MessageBubble v-for="m in messages" :key="m.id" :role="m.role" :content="m.content" />
        <!-- AI 正在生成：打字中气泡 -->
        <div v-if="thinking" class="msg-bubble msg-assistant msg-typing">
          <span class="typing-dot" v-for="n in 3" :key="n"></span>
        </div>
      </div>

      <!-- 人工客服对话区（HumanAgentChat：状态横幅 + 消息列表） -->
      <div v-else class="human-wrap">
        <HumanAgentChat
          :messages="humanMessages"
          :status="humanStatus"
          :agent-name="agentName"
        />
      </div>

      <!-- 输入区（转人工后同样可继续留言给人工客服） -->
      <div class="chat-input-bar">
        <el-input
          v-model="inputText"
          :placeholder="handoff ? (humanStatus === 'HUMAN' ? '给人工客服留言…' : '人工客服接入中，可继续留言…') : '请输入您的问题…'"
          :disabled="thinking"
          clearable
          maxlength="2000"
          @keyup.enter="handleSend"
        />
        <div class="chat-actions">
          <el-button size="small" type="primary" :loading="thinking" :disabled="!inputText.trim() || !isLogin" @click="handleSend">
            {{ handoff ? '留言' : '发送' }}
          </el-button>
          <el-button size="small" :disabled="thinking || handoff" @click="handleTransfer">
            转人工
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { sendChatMessage, transferToHuman, getChatStatus, sendHumanMessage } from '../api/chat'
import MessageBubble from '../components/MessageBubble.vue'
import HumanAgentChat from '../components/HumanAgentChat.vue'
import { useUserStore } from '../store/user'

/**
 * 悬浮客服聊天窗（阶段 11.5 前端核心 + 11.6 转人工增强）。
 *
 * 功能：
 * - 右下角悬浮按钮（未读消息角标）；
 * - AI 模式：消息列表 + 流式逐字接收 SSE（fetch + ReadableStream）；
 * - 转人工（11.6）：调 /api/chat/transfer（独立接口）→ 会话进入排队；
 *   若返回 HUMAN 立即显示"客服已接入"；若返回 WAITING_FOR_HUMAN 启动
 *   轮询 /api/chat/status（3s），直到客服接入（HUMAN）或会话关闭（CLOSED）；
 * - 人工模式：切换 HumanAgentChat 界面，留言走非流式接口直接落库；
 * - 未登录：点击发送/转人工提示并跳登录页。
 */

const router = useRouter()
const userStore = useUserStore()
// 从 Pinia store 取响应式登录态（登录/登出时自动更新，避免手动同步 localStorage）
const { isLogin } = storeToRefs(userStore)

const open = ref(false)        // 面板展开/收起
const unread = ref(0)          // 收起时的未读角标数
const messages = ref([])       // AI 模式消息列表（role: user/assistant）
const humanMessages = ref([])  // 人工模式消息列表（含 system 通知）
const inputText = ref('')      // 输入框内容
const thinking = ref(false)    // 是否正在发送（期间禁用输入）
const handoff = ref(false)     // 是否已转人工（AI 主动或用户主动）
const humanStatus = ref('WAITING_FOR_HUMAN') // 人工会话状态：排队/接入/关闭
const agentName = ref('')      // 接待客服昵称（工作台绑定后显示）
const sessionId = ref(null)    // 当前会话 ID（轮询状态用）
const msgListRef = ref(null)

let msgId = 0
let statusTimer = null // 状态轮询定时器

/** 新增一条 AI 模式消息并滚动到底部 */
function pushMessage(role, content) {
  messages.value.push({ id: ++msgId, role, content })
  scrollToBottom()
}

/** 新增一条人工模式消息（user 直接留言 / system 系统通知） */
function pushHumanMessage(role, content) {
  humanMessages.value.push({ id: ++msgId, role, content })
  scrollToBottom()
}

/** 消息列表滚动到底部（nextTick 等 DOM 渲染完成） */
async function scrollToBottom() {
  await nextTick()
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight
  }
}

/** 未登录提示：跳转登录页并保留来源 */
function requireLogin() {
  ElMessage.warning('请先登录后再与客服对话')
  router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
}

/** 发送消息：AI 模式流式对话；人工模式留言落库 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  if (!isLogin) { requireLogin(); return }
  inputText.value = ''

  // ---------- 分支：人工模式（转人工后）→ 留言，等待客服工作台回复 ----------
  if (handoff.value) {
    pushHumanMessage('user', text)
    thinking.value = true
    try {
      const tip = await sendHumanMessage(text)
      pushHumanMessage('system', tip)
    } catch (e) {
      pushHumanMessage('system', e.message || '发送失败，请稍后重试')
    } finally {
      thinking.value = false
    }
    return
  }

  // ---------- AI 模式：流式消费 SSE ----------
  pushMessage('user', text)
  thinking.value = true
  let assistantText = '' // 增量累积：done 时一次成型
  // 动态气泡：逐字先展示（用一条 assistant 消息承载增量）
  const streamMsg = { id: ++msgId, role: 'assistant', content: '' }
  messages.value.push(streamMsg)

  try {
    await sendChatMessage(text, {
      onStatus: () => { /* status=thinking：由顶部打字气泡提示，无需额外处理 */ },
      onDelta: (ch) => {
        assistantText += ch
        streamMsg.content = assistantText
        scrollToBottom()
      },
      onDone: (evt) => {
        // done 事件带完整回复：覆盖增量文本（避免漏字/乱序）
        streamMsg.content = evt.response || assistantText
        thinking.value = false
        scrollToBottom()
        // 11.6：AI 主动转人工（done.action = transfer_to_human）→ 进入人工模式
        if (evt.action === 'transfer_to_human' || evt.handoff) {
          enterHumanMode(evt.response || '已为您转接人工客服，请稍候。')
        }
      },
      onError: (msg) => {
        thinking.value = false
        streamMsg.content = msg || 'AI 客服服务暂时不可用，请稍后再试'
        scrollToBottom()
      }
    })
  } finally {
    // 兜底：无论正常结束、异常还是连接中断，都要复位"正在输入"状态，
    // 避免 UI 永久卡死（如后端异常切断 SSE 流时 onDone/onError 可能缺失）
    thinking.value = false
    scrollToBottom()
  }
}

/** 用户主动转人工（11.6：独立接口 + 状态轮询） */
async function handleTransfer() {
  if (!isLogin) { requireLogin(); return }
  thinking.value = true
  const text = inputText.value.trim()
  if (text) { inputText.value = '' }
  try {
    const data = await transferToHuman(text || '需要人工客服')
    sessionId.value = data.sessionId
    pushHumanMessage('system', data.message || '已为您转接人工客服，请稍候。')
    if (data.status === 'HUMAN') {
      // 有空闲客服：立即接入
      humanStatus.value = 'HUMAN'
      agentName.value = data.agentName || ''
    } else {
      // 排队中：启动轮询，等客服工作台接入
      humanStatus.value = 'WAITING_FOR_HUMAN'
      startStatusPolling()
    }
    enterHumanMode(data.message || '已为您转接人工客服，请稍候。')
  } catch (e) {
    pushMessage('assistant', e.message || '转人工失败，请稍后重试')
  } finally {
    thinking.value = false
  }
}

/** 进入人工模式：切换界面 + 同步已有消息（把 AI 对话带过去，保证上下文连续） */
function enterHumanMode(tipText) {
  handoff.value = true
  // 把 AI 模式的对话原样迁入人工模式（用户可见历史不丢）
  if (humanMessages.value.length === 0) {
    humanMessages.value = messages.value.map((m) => ({ ...m }))
    if (tipText) pushHumanMessage('system', tipText)
  }
  stopStatusPolling()
}

/** 轮询会话状态：客服接入（HUMAN）或关闭（CLOSED）即停止 */
function startStatusPolling() {
  stopStatusPolling()
  statusTimer = setInterval(async () => {
    if (!sessionId.value) return
    try {
      const st = await getChatStatus(sessionId.value)
      if (st.status === 'HUMAN') {
        humanStatus.value = 'HUMAN'
        agentName.value = st.agentName || ''
        pushHumanMessage('system', st.agentName ? `客服「${st.agentName}」已接入，正在为您服务` : '客服已接入，正在为您服务')
        stopStatusPolling()
      } else if (st.status === 'CLOSED') {
        humanStatus.value = 'CLOSED'
        pushHumanMessage('system', '本次会话已结束，感谢您的咨询')
        stopStatusPolling()
      }
    } catch (e) {
      // 轮询失败不打断（网络抖动时静默，下一轮再试）
    }
  }, 3000)
}

function stopStatusPolling() {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
}

// 收起时收到新消息 → 未读角标 +1；打开面板时清零
watch(open, (val) => { if (val) unread.value = 0 })
watch(() => messages.value.length + humanMessages.value.length, () => {
  if (!open.value) unread.value += 1
})

// 组件卸载兜底：清轮询定时器
onBeforeUnmount(() => {
  stopStatusPolling()
})
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 2000; /* 高于普通弹层，低于全局消息 */
  font-size: 13px;
}
/* 悬浮按钮：橙色圆形（商城主题色） */
.chat-float-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: #ff5000;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 80, 0, 0.35);
  transition: transform 0.2s;
}
.chat-float-btn:hover {
  transform: scale(1.06);
}
.chat-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #f5222d;
  color: #fff;
  font-size: 11px;
  text-align: center;
}
/* 面板 */
.chat-panel {
  width: 340px;
  height: 460px;
  background: #f7f8fa;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  height: 46px;
  background: #ff5000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
}
.chat-title {
  font-weight: 600;
  font-size: 14px;
}
.chat-close {
  cursor: pointer;
  font-size: 16px;
}
.chat-close:hover {
  opacity: 0.8;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
/* 人工客服对话区容器：占满面板中部（HumanAgentChat 内部再撑高） */
.human-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.human-wrap > * {
  width: 100%;
  height: 100%;
}
/* 打字中气泡 */
.msg-typing {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #eee;
  padding: 10px 14px;
  display: flex;
  gap: 4px;
}
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #999;
  animation: typing-blink 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-blink {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
/* 输入区 */
.chat-input-bar {
  border-top: 1px solid #e5e5e5;
  background: #fff;
  padding: 10px 12px;
}
.chat-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

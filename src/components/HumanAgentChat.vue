<template>
  <!-- 人工客服对话界面（阶段 11.6）：状态横幅 + 消息列表 -->
  <div class="human-chat">
    <!-- 状态横幅：排队 / 已接入 / 已关闭 -->
    <div class="human-status-bar" :class="statusClass">
      <el-icon :size="14" v-if="status === 'WAITING_FOR_HUMAN'"><Clock /></el-icon>
      <el-icon :size="14" v-else-if="status === 'HUMAN'"><Service /></el-icon>
      <el-icon :size="14" v-else><CircleCheck /></el-icon>
      <span>{{ statusText }}</span>
    </div>

    <!-- 消息列表（与 AI 对话同一套气泡；system 消息单独居中灰字） -->
    <div ref="listRef" class="human-messages">
      <template v-for="m in messages" :key="m.id">
        <div v-if="m.role === 'system'" class="sys-msg">{{ m.content }}</div>
        <MessageBubble v-else :key="'b' + m.id" :role="m.role" :content="m.content" />
      </template>
      <!-- 客服正在输入占位（人工模式下暂无实时状态，预留） -->
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { CircleCheck, Clock, Service } from '@element-plus/icons-vue'
import MessageBubble from './MessageBubble.vue'

/**
 * 人工客服聊天界面（阶段 11.6）。
 *
 * 职责：转人工成功后展示"人工客服对话区"——顶部状态横幅
 * （WAITING_FOR_HUMAN=排队中 / HUMAN=客服已接入 / CLOSED=已结束）
 * + 消息列表。消息沿用 MessageBubble（user 右橙、assistant 左白），
 * 系统通知（如"客服已接入"）以居中灰色小字呈现，与对话内容区分。
 *
 * @param {Array}  messages   消息列表 [{id, role(user/assistant/system), content}]
 * @param {String} status     会话状态：WAITING_FOR_HUMAN / HUMAN / CLOSED
 * @param {String} agentName  接待客服昵称（status=HUMAN 时展示）
 */
const props = defineProps({
  messages: { type: Array, default: () => [] },
  status: { type: String, default: 'WAITING_FOR_HUMAN' },
  agentName: { type: String, default: '' }
})

/** 状态横幅文案（随状态切换，前端即时反馈） */
const statusText = computed(() => {
  if (props.status === 'HUMAN') {
    return props.agentName ? `客服「${props.agentName}」已接入，正在为您服务` : '客服已接入，正在为您服务'
  }
  if (props.status === 'CLOSED') return '本次会话已结束，感谢您的咨询'
  return '正在为您转接人工客服，请稍候……'
})

const statusClass = computed(() => {
  if (props.status === 'HUMAN') return 'status-human'
  if (props.status === 'CLOSED') return 'status-closed'
  return 'status-waiting'
})

const listRef = ref(null)

/** 新消息/状态变化时滚动到底部 */
watch(() => [props.messages.length, props.status], async () => {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}, { deep: true })
</script>

<style scoped>
.human-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}
/* 状态横幅：三态配色（等待=蓝、接入=绿、结束=灰） */
.human-status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-waiting {
  background: #e8f3ff;
  color: #1677ff;
}
.status-human {
  background: #e6f7ed;
  color: #13a34f;
}
.status-closed {
  background: #f2f3f5;
  color: #666;
}
.human-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
/* 系统通知：居中灰色小字（如"客服已接入，正在为您服务"） */
.sys-msg {
  align-self: center;
  background: rgba(0, 0, 0, 0.04);
  color: #888;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  margin-bottom: 10px;
}
</style>

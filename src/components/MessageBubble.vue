<template>
  <!-- 消息气泡：用户消息右侧橙色，AI 消息左侧白色 -->
  <div class="msg-bubble" :class="[role === 'user' ? 'msg-user' : 'msg-assistant']">
    <!-- v-html 内容是经过 escapeHtml 转义后再做 Markdown 渲染的，无 XSS 风险 -->
    <div class="msg-content" v-html="rendered"></div>
    <div class="msg-time">{{ timeText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 消息气泡组件（阶段 11.5）。
 *
 * Markdown 渲染策略：
 * - 项目未引入 markdown 渲染库（package.json 无 marked/markdown-it），
 *   为避免为一个小气泡引入整套依赖，这里用"转义 → 迷你渲染"方案：
 *   1. escapeHtml 先转义全部 HTML 特殊字符（杜绝 XSS）；
 *   2. 在转义后的安全文本上做正则渲染：代码块、粗体、行内代码、链接、换行。
 * 若后续客服回复需要更丰富的 Markdown（表格/标题/列表），再换成 marked 并
 * 配置 DOMPurify 清洗即可（本组件只留一个渲染函数，替换成本低）。
 */

const props = defineProps({
  /** 消息角色：user（我）/ assistant（客服） */
  role: { type: String, default: 'assistant' },
  /** 消息文本（原始 Markdown） */
  content: { type: String, default: '' }
})

/** 当前时间（HH:mm） */
const timeText = computed(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

/** HTML 转义：把 < > & " ' 换成实体，防止客服回复里的 HTML/脚本注入 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 转义后安全文本的迷你 Markdown 渲染（顺序敏感：先代码块，再行内） */
function renderMiniMarkdown(escaped) {
  let html = escaped
  // 1) 代码块：```lang\n...\n``` → 预格式块（内容不再做其他 Markdown 处理）
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    const inner = escapeHtml(code.replace(/^[a-zA-Z]+\n/, '')) // 去掉语言标识行
    return `<pre class="md-code-block">${inner}</pre>`
  })
  // 2) 粗体：**文字** / __文字__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // 3) 行内代码：`code`
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  // 4) 链接：[文本](url)（仅 http/https，防止 javascript: 伪协议）
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  // 5) 换行：\n → <br/>（block 已处理，普通文本保留换行）
  html = html.replace(/\n/g, '<br/>')
  return html
}

/** 最终渲染 HTML：转义 → 迷你 Markdown */
const rendered = computed(() => renderMiniMarkdown(escapeHtml(props.content)))
</script>

<style scoped>
.msg-bubble {
  display: flex;
  flex-direction: column;
  max-width: 82%;
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  word-break: break-word;
  line-height: 1.6;
  font-size: 13px;
}
/* 用户消息：橙色（商城主题色）右对齐 */
.msg-user {
  align-self: flex-end;
  background: #ff5000;
  color: #fff;
  border-top-right-radius: 2px;
}
/* 客服消息：白色左对齐 */
.msg-assistant {
  align-self: flex-start;
  background: #fff;
  color: #333;
  border: 1px solid #eee;
  border-top-left-radius: 2px;
}
.msg-content {
  white-space: normal;
}
.msg-time {
  align-self: flex-end;
  font-size: 10px;
  opacity: 0.7;
  margin-top: 3px;
}
/* Markdown 元素样式（scoped 下对 v-html 内容生效，需 :deep） */
:deep(.md-code-block) {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  margin: 6px 0;
  white-space: pre-wrap;
}
:deep(.md-inline-code) {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 3px;
  padding: 0 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
}
:deep(.msg-content a) {
  color: inherit;
  text-decoration: underline;
}
</style>

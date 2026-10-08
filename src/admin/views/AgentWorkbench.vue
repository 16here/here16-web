<template>
  <!-- 客服工作台（阶段 11.6）：人工客服管理 + 工单会话处理 -->
  <div class="agent-workbench">
    <!-- ================= 一、客服管理 ================= -->
    <el-card shadow="never" class="card">
      <template #header>
        <div class="card-header">
          <span>客服管理</span>
          <el-button size="small" type="primary" @click="openAgentDialog()">
            <el-icon><Plus /></el-icon> 新增客服
          </el-button>
        </div>
      </template>

      <el-table :data="agents" v-loading="agentsLoading" size="small">
        <el-table-column prop="agent_id" label="客服ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="max_concurrent" label="最大并发" width="100" />
        <el-table-column prop="serving_count" label="当前接待" width="100" />
        <el-table-column label="操作" min-width="180">
          <template #default="{ row }">
            <el-button link size="small" type="primary" @click="openAgentDialog(row)">编辑</el-button>
            <el-button
              link size="small"
              :type="row.status === 'ONLINE' || row.status === 'BUSY' ? 'warning' : 'success'"
              @click="toggleAgentStatus(row)"
            >{{ row.status === 'ONLINE' || row.status === 'BUSY' ? '下线' : '上线' }}</el-button>
            <el-button link size="small" type="danger" @click="onDeleteAgent(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ================= 二、会话工作台 ================= -->
    <el-card shadow="never" class="card workbench">
      <template #header>
        <div class="card-header">
          <span>会话工作台</span>
          <div class="wb-tabs">
            <el-radio-group v-model="sessionFilter" size="small" @change="loadSessions">
              <el-radio-button value="WAITING_FOR_HUMAN">排队中</el-radio-button>
              <el-radio-button value="HUMAN">接待中</el-radio-button>
              <el-radio-button value="CLOSED">已关闭</el-radio-button>
            </el-radio-group>
            <el-button size="small" :icon="Refresh" circle @click="refreshAll" />
          </div>
        </div>
      </template>

      <!-- 左右分栏：会话列表 + 消息区 -->
      <div class="wb-body">
        <!-- 左：会话列表 -->
        <div class="wb-sessions">
          <div
            v-for="s in sessions"
            :key="s.session_id"
            class="wb-session"
            :class="{ active: currentSessionId === s.session_id }"
            @click="openSession(s.session_id)"
          >
            <div class="ws-head">
              <span class="ws-user">{{ s.user_name }}</span>
              <el-tag size="small" :type="s.status === 'HUMAN' ? 'success' : s.status === 'WAITING_FOR_HUMAN' ? 'warning' : 'info'">
                {{ s.status === 'HUMAN' ? '接待中' : s.status === 'WAITING_FOR_HUMAN' ? '排队' : '已关闭' }}
              </el-tag>
            </div>
            <div class="ws-meta">
              <span>会话 #{{ s.session_id }}</span>
              <span v-if="s.agent_name">客服：{{ s.agent_name }}</span>
            </div>
            <div class="ws-meta">消息 {{ s.msg_count }} 条 · {{ formatTime(s.update_time) }}</div>
          </div>
          <el-empty v-if="!sessions.length && !sessionsLoading" description="暂无该状态会话" :image-size="60" />
        </div>

        <!-- 右：会话详情 + 回复 -->
        <div class="wb-chat">
          <template v-if="currentSession">
            <!-- 消息流 -->
            <div ref="chatBodyRef" class="wb-messages">
              <div v-for="m in currentSession.messages" :key="m.message_id" class="wb-msg" :class="m.role">
                <span class="wb-role">{{ roleText(m.role) }}</span>
                <div class="wb-msg-content">{{ m.content }}</div>
                <span class="wb-msg-time">{{ formatTime(m.create_time) }}</span>
              </div>
              <el-empty v-if="!currentSession.messages.length" description="暂无消息" :image-size="50" />
            </div>

            <!-- 操作区：按会话状态给按钮 -->
            <div class="wb-actions">
              <el-button
                v-if="currentSession.status === 'WAITING_FOR_HUMAN'"
                type="primary" size="small" :loading="acting"
                @click="onAccept(currentSession.session_id)"
              >接入会话</el-button>
              <el-button
                v-if="currentSession.status === 'HUMAN'"
                type="warning" size="small" :loading="acting"
                @click="onTransfer(currentSession.session_id)"
              >转接</el-button>
              <el-button
                v-if="currentSession.status !== 'CLOSED'"
                type="danger" plain size="small" :loading="acting"
                @click="onClose(currentSession.session_id)"
              >关闭会话</el-button>
              <span class="wb-status-tip">{{ currentSession.status === 'CLOSED' ? '会话已关闭（只读）' : '' }}</span>
            </div>

            <!-- 回复框：接待中/排队中可回复 -->
            <div v-if="currentSession.status !== 'CLOSED'" class="wb-reply">
              <el-input
                v-model="replyText"
                type="textarea"
                :rows="2"
                maxlength="1000"
                placeholder="输入回复内容，发送给用户…"
              />
              <el-button type="primary" size="small" :disabled="!replyText.trim()" :loading="acting" @click="onReply(currentSession.session_id)">
                发送回复
              </el-button>
            </div>
          </template>
          <el-empty v-else description="左侧选择一个会话查看详情" />
        </div>
      </div>
    </el-card>

    <!-- ================= 新增/编辑客服弹窗 ================= -->
    <el-dialog v-model="agentDialog" :title="agentForm.agent_id ? '编辑客服' : '新增客服'" width="420px">
      <el-form label-width="100px">
        <el-form-item label="用户 ID" v-if="!agentForm.agent_id">
          <el-input-number v-model="agentForm.userId" :min="1" style="width: 100%" placeholder="把已注册用户登记为客服" />
        </el-form-item>
        <el-form-item label="最大并发">
          <el-input-number v-model="agentForm.maxConcurrent" :min="1" :max="50" />
          <div class="form-tip">同时最多接待的会话数（满载自动标记 BUSY）</div>
        </el-form-item>
        <el-form-item label="状态" v-if="agentForm.agent_id">
          <el-radio-group v-model="agentForm.status">
            <el-radio value="ONLINE">在线</el-radio>
            <el-radio value="OFFLINE">离线</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="agentDialog = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="onSaveAgent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  listAgents, createAgent, updateAgent, deleteAgent,
  listSessions, getSessionDetail, acceptSession, transferSession, replyMessage, closeSession
} from '../api/agent'

/**
 * 客服工作台（阶段 11.6）。
 *
 * 两个功能区：
 * 1. 客服管理：新增（把普通用户登记为客服）/ 上下线 / 并发调整 / 删除；
 * 2. 会话工作台：
 *    - 会话列表按状态筛选（排队/接待中/已关闭）；
 *    - 排队会话：点"接入会话"自动分配在线空闲客服（后端轮询选择）；
 *    - 接待中会话：回复（落库后用户端 HumanAgentChat 轮询可见）、转接、关闭；
 *    - 已关闭会话：只读。
 * 刷新策略：进入页面 + 切换 Tab + 每 3s 轮询会话列表（新排队会话实时可见）。
 */

const agents = ref([])
const agentsLoading = ref(false)
const sessions = ref([])
const sessionsLoading = ref(false)
const sessionFilter = ref('WAITING_FOR_HUMAN')
const currentSessionId = ref(null)
const currentSession = ref(null)
const replyText = ref('')
const acting = ref(false)
const chatBodyRef = ref(null)

const agentDialog = ref(false)
const agentForm = ref({ agent_id: null, userId: 1, maxConcurrent: 2, status: 'ONLINE' })

let refreshTimer = null

// ---------------- 客服管理 ----------------
async function loadAgents() {
  agentsLoading.value = true
  try {
    agents.value = await listAgents()
  } catch (e) {
    ElMessage.error(e.message || '加载客服失败')
  } finally {
    agentsLoading.value = false
  }
}

function openAgentDialog(row) {
  if (row) {
    agentForm.value = { agent_id: row.agent_id, userId: row.user_id, maxConcurrent: row.max_concurrent, status: row.status }
  } else {
    agentForm.value = { agent_id: null, userId: 1, maxConcurrent: 2, status: 'ONLINE' }
  }
  agentDialog.value = true
}

async function onSaveAgent() {
  acting.value = true
  try {
    if (agentForm.value.agent_id) {
      await updateAgent(agentForm.value.agent_id, {
        status: agentForm.value.status,
        maxConcurrent: agentForm.value.maxConcurrent
      })
      ElMessage.success('客服已更新')
    } else {
      await createAgent(agentForm.value.userId, agentForm.value.maxConcurrent)
      ElMessage.success('客服已新增（默认上线）')
    }
    agentDialog.value = false
    loadAgents()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    acting.value = false
  }
}

async function toggleAgentStatus(row) {
  const offline = row.status === 'ONLINE' || row.status === 'BUSY'
  try {
    await updateAgent(row.agent_id, { status: offline ? 'OFFLINE' : 'ONLINE' })
    ElMessage.success(offline ? '已下线（不再接新单，已接入会话不受影响）' : '已上线')
    loadAgents()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function onDeleteAgent(row) {
  await ElMessageBox.confirm(`确定删除客服「${row.username}」？有接待中会话时会被拒绝。`, '删除确认', { type: 'warning' })
  try {
    await deleteAgent(row.agent_id)
    ElMessage.success('已删除')
    loadAgents()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

// ---------------- 会话工作台 ----------------
async function loadSessions() {
  sessionsLoading.value = true
  try {
    sessions.value = await listSessions(sessionFilter.value)
  } catch (e) {
    ElMessage.error(e.message || '加载会话失败')
  } finally {
    sessionsLoading.value = false
  }
}

async function openSession(sessionId) {
  currentSessionId.value = sessionId
  try {
    currentSession.value = await getSessionDetail(sessionId)
    scrollToBottom()
  } catch (e) {
    ElMessage.error(e.message || '加载会话详情失败')
  }
}

/** 刷新列表 + 当前打开的会话（保持工作台新鲜） */
async function refreshAll() {
  await Promise.all([loadAgents(), loadSessions()])
  if (currentSessionId.value) {
    openSession(currentSessionId.value)
  }
}

async function onAccept(sessionId) {
  acting.value = true
  try {
    const res = await acceptSession(sessionId)
    ElMessage.success(res.message || '已接入')
    await refreshAll()
  } catch (e) {
    ElMessage.error(e.message || '接入失败')
  } finally {
    acting.value = false
  }
}

async function onTransfer(sessionId) {
  await ElMessageBox.confirm('转接后会话回到排队队列，将重新分配给空闲客服。', '转接确认', { type: 'warning' })
  acting.value = true
  try {
    await transferSession(sessionId)
    ElMessage.success('已转回排队')
    await refreshAll()
  } catch (e) {
    ElMessage.error(e.message || '转接失败')
  } finally {
    acting.value = false
  }
}

async function onClose(sessionId) {
  await ElMessageBox.confirm('关闭后会话结束（只读），无法再回复。确定关闭？', '关闭确认', { type: 'warning' })
  acting.value = true
  try {
    await closeSession(sessionId)
    ElMessage.success('会话已关闭')
    await refreshAll()
  } catch (e) {
    ElMessage.error(e.message || '关闭失败')
  } finally {
    acting.value = false
  }
}

async function onReply(sessionId) {
  const text = replyText.value.trim()
  if (!text) return
  acting.value = true
  try {
    await replyMessage(sessionId, text)
    replyText.value = ''
    await openSession(sessionId)
    ElMessage.success('已发送')
  } catch (e) {
    ElMessage.error(e.message || '发送失败')
  } finally {
    acting.value = false
  }
}

// ---------------- 工具 ----------------
function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  })
}

function statusText(status) {
  return { ONLINE: '在线', OFFLINE: '离线', BUSY: '忙碌' }[status] || status
}
function statusTagType(status) {
  return { ONLINE: 'success', OFFLINE: 'info', BUSY: 'warning' }[status] || 'info'
}
function roleText(role) {
  return { user: '用户', assistant: '客服', system: '系统' }[role] || role
}
function formatTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(5, 16)
}

onMounted(() => {
  loadAgents()
  loadSessions()
  // 3s 轮询：新排队会话/客服接入实时可见（配合 Redis 通知双通道兜底）
  refreshTimer = setInterval(() => {
    loadAgents()
    loadSessions()
  }, 3000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.agent-workbench {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.wb-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.workbench :deep(.el-card__body) {
  padding: 12px;
}
.wb-body {
  display: flex;
  gap: 12px;
  height: 460px;
}
/* 左：会话列表 */
.wb-sessions {
  width: 260px;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow-y: auto;
  padding: 8px;
  background: #fafbfc;
}
.wb-session {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #eee;
}
.wb-session:hover {
  border-color: #ff5000;
}
.wb-session.active {
  border-color: #ff5000;
  background: #fff7f3;
}
.ws-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ws-user {
  font-weight: 600;
  font-size: 13px;
}
.ws-meta {
  font-size: 12px;
  color: #999;
  margin-top: 3px;
}
/* 右：消息区 */
.wb-chat {
  flex: 1;
  border: 1px solid #eee;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.wb-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f7f8fa;
}
.wb-msg {
  margin-bottom: 10px;
  max-width: 82%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  background: #fff;
  border: 1px solid #eee;
  word-break: break-word;
}
.wb-msg.user {
  margin-left: auto;
  background: #ff5000;
  color: #fff;
  border-color: #ff5000;
}
.wb-msg.system {
  margin: 0 auto;
  max-width: 90%;
  background: rgba(0, 0, 0, 0.04);
  color: #888;
  font-size: 12px;
  text-align: center;
}
.wb-role {
  display: block;
  font-size: 11px;
  opacity: 0.75;
  margin-bottom: 2px;
}
.wb-msg.user .wb-role {
  text-align: right;
}
.wb-msg-time {
  display: block;
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}
.wb-actions {
  padding: 8px 12px;
  border-top: 1px solid #eee;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.wb-status-tip {
  font-size: 12px;
  color: #999;
}
.wb-reply {
  padding: 10px 12px;
  border-top: 1px solid #eee;
  background: #fff;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  width: 100%;
}
</style>

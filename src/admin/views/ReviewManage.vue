<template>
  <!-- 管理端评价管理（阶段 7）：状态筛选 + 评价表格 + 审核 + 回复 -->
  <div class="review-manage">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="onSearch">
        <el-option label="待审核" :value="0" />
        <el-option label="已发布" :value="1" />
        <el-option label="已隐藏" :value="2" />
      </el-select>
      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="loadReviews">刷新</el-button>
    </div>

    <!-- 评价表格 -->
    <el-table :data="reviews" v-loading="loading" border stripe>
      <el-table-column prop="productName" label="商品" min-width="180" show-overflow-tooltip />
      <el-table-column prop="username" label="用户" width="110" />
      <el-table-column label="评分" width="120">
        <template #default="{ row }">
          <el-rate :model-value="row.rating" disabled />
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评价内容" min-width="260" show-overflow-tooltip />
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.images && row.images.length"
            :src="row.images[0]"
            :preview-src-list="row.images"
            fit="cover"
            class="review-img"
            preview-teleported
          />
          <span v-else class="no-img">无</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评价时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <!-- 待审核：通过 / 隐藏 -->
          <template v-if="row.status === 0">
            <el-button link type="success" @click="onAudit(row, 1)">通过</el-button>
            <el-button link type="warning" @click="onAudit(row, 2)">隐藏</el-button>
          </template>
          <!-- 已发布：可隐藏 -->
          <template v-else-if="row.status === 1">
            <el-button link type="warning" @click="onAudit(row, 2)">隐藏</el-button>
            <el-button link type="primary" @click="openReply(row)">回复</el-button>
          </template>
          <!-- 已隐藏：可恢复发布 -->
          <template v-else>
            <el-button link type="success" @click="onAudit(row, 1)">恢复</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadReviews"
      />
    </div>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="商家回复" width="440px">
      <el-form label-width="80px">
        <el-form-item label="评价">
          <p class="reply-content">{{ replyTarget?.content }}</p>
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input
            v-model="replyText"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="回复买家，如：感谢您的支持，欢迎回购~"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="onReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listReviews, auditReview, replyReview } from '../api/review'

const reviews = ref([])
const loading = ref(false)
const total = ref(0)

/** 查询条件 */
const query = reactive({
  status: null,
  page: 1,
  pageSize: 10
})

/** 回复弹窗状态 */
const replyVisible = ref(false)
const replyTarget = ref(null)
const replyText = ref('')
const replying = ref(false)

/** 加载评价列表 */
async function loadReviews() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.status !== null && query.status !== '') params.status = query.status
    const res = await listReviews(params)
    reviews.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 查询：回到第一页 */
function onSearch() {
  query.page = 1
  loadReviews()
}

/** 审核（通过/隐藏/恢复） */
async function onAudit(row, status) {
  const action = status === 1 ? '审核通过并发布' : '隐藏'
  try {
    await ElMessageBox.confirm(`确认${action}这条评价吗？`, '评价审核', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await auditReview(row.id, status)
    ElMessage.success(action === '隐藏' ? '已隐藏评价' : '已审核通过')
    await loadReviews()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 打开回复弹窗 */
function openReply(row) {
  replyTarget.value = row
  replyText.value = row.reply || ''
  replyVisible.value = true
}

/** 提交回复 */
async function onReply() {
  if (!replyText.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  replying.value = true
  try {
    await replyReview(replyTarget.value.id, replyText.value.trim())
    ElMessage.success('回复成功')
    replyVisible.value = false
    await loadReviews()
  } catch (e) {
    // 拦截器已提示
  } finally {
    replying.value = false
  }
}

/** 状态标签配色 */
function statusTagType(status) {
  return ['warning', 'success', 'info'][status] || 'info'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(loadReviews)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.review-img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

.no-img {
  color: #999;
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.reply-content {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  background: #fafafa;
  border-radius: 4px;
  padding: 8px 10px;
}
</style>

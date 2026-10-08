<template>
  <!-- 我的售后列表页（阶段 7）：状态 Tab + 售后卡片 + 操作（撤销/填物流）+ 详情弹窗 -->
  <div v-loading="loading" class="page-container after-sale-list-page">
    <div class="page-head">
      <h2>我的售后</h2>
      <router-link to="/after-sales/apply">
        <el-button type="danger" plain>申请售后</el-button>
      </router-link>
    </div>

    <!-- 状态 Tab：0待审核 1待寄回 2已完成 3已拒绝 4已撤销 -->
    <el-tabs v-model="activeStatus" class="status-tabs" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待审核" name="0" />
      <el-tab-pane label="待寄回" name="1" />
      <el-tab-pane label="已完成" name="2" />
      <el-tab-pane label="已拒绝" name="3" />
      <el-tab-pane label="已撤销" name="4" />
    </el-tabs>

    <!-- 售后卡片 -->
    <template v-if="list.length > 0">
      <div v-for="as in list" :key="as.id" class="as-card">
        <div class="card-head">
          <span class="as-no">售后单：{{ as.afterSaleNo }}</span>
          <span class="order-no">订单：{{ as.orderNo }}</span>
          <span class="status" :class="`st-${as.status}`">{{ as.statusText }}</span>
        </div>

        <div class="card-body">
          <div class="type-info">
            <p>
              <span class="label">类型：</span>{{ as.typeText }}
            </p>
            <p>
              <span class="label">退款金额：</span>
              <b class="amount">¥{{ Number(as.amount).toFixed(2) }}</b>
            </p>
            <p>
              <span class="label">申请原因：</span>{{ as.reason }}
            </p>
            <p v-if="as.logisticsNo">
              <span class="label">退货物流：</span>{{ as.logisticsNo }}
            </p>
            <p v-if="as.auditRemark">
              <span class="label">审核意见：</span>{{ as.auditRemark }}
            </p>
            <p>
              <span class="label">申请时间：</span>{{ formatTime(as.applyAt) }}
            </p>
          </div>
          <div class="items">
            <OrderItemCard v-for="item in as.items" :key="item.orderItemId" :item="item" />
          </div>
        </div>

        <div class="card-foot">
          <el-button size="small" @click="openDetail(as)">详情</el-button>
          <!-- 待审核可撤销 -->
          <el-button v-if="as.status === 0" size="small" type="danger" plain @click="onCancel(as)">
            撤销申请
          </el-button>
          <!-- 待寄回（退货退款）可填退货物流 -->
          <el-button v-if="as.status === 1" size="small" type="primary" @click="openLogistics(as)">
            填写退货物流
          </el-button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="load"
        />
      </div>
    </template>

    <el-empty v-else-if="!loading" description="暂无售后记录" />

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="售后详情" width="520px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="售后单号">{{ detail.afterSaleNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.typeText }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="tagType(detail.status)">{{ detail.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退款金额">¥{{ Number(detail.amount).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="申请原因">{{ detail.reason }}</el-descriptions-item>
          <el-descriptions-item label="退货物流">{{ detail.logisticsNo || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="审核意见">{{ detail.auditRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatTime(detail.applyAt) }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ formatTime(detail.auditAt) }}</el-descriptions-item>
          <el-descriptions-item label="退款时间">{{ formatTime(detail.refundAt) }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- 填退货物流弹窗 -->
    <el-dialog v-model="logisticsVisible" title="填写退货物流" width="440px">
      <el-form label-width="90px">
        <el-form-item label="售后单号">
          <span>{{ logisticsTarget?.afterSaleNo }}</span>
        </el-form-item>
        <el-form-item label="物流单号" required>
          <el-input v-model="logisticsNo" placeholder="请输入退货快递单号，如 YD1234567890" maxlength="64" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="logisticsVisible = false">取消</el-button>
        <el-button type="primary" :loading="logisticsSubmitting" @click="onFillLogistics">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAfterSales, getAfterSaleDetail, cancelAfterSale, fillLogistics } from '../api/afterSale'
import OrderItemCard from '../components/OrderItemCard.vue'

const list = ref([])
const loading = ref(false)
const activeStatus = ref('all')
const page = ref(1)
const pageSize = 10
const total = ref(0)

/** 详情弹窗 */
const detailVisible = ref(false)
const detail = ref(null)

/** 填物流弹窗 */
const logisticsVisible = ref(false)
const logisticsTarget = ref(null)
const logisticsNo = ref('')
const logisticsSubmitting = ref(false)

/** 加载售后列表 */
async function load() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (activeStatus.value !== 'all') params.status = Number(activeStatus.value)
    const res = await getAfterSales(params)
    list.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 切换 Tab */
function onTabChange() {
  page.value = 1
  load()
}

/** 打开详情弹窗（列表可能不带 items，详情接口补齐） */
async function openDetail(row) {
  try {
    const res = await getAfterSaleDetail(row.id)
    detail.value = res.data
    detailVisible.value = true
  } catch (e) {
    // 拦截器已提示
  }
}

/** 撤销售后申请 */
async function onCancel(row) {
  try {
    await ElMessageBox.confirm('确定撤销该售后申请吗？', '撤销申请', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await cancelAfterSale(row.id)
    ElMessage.success('已撤销售后申请')
    await load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 打开填物流弹窗 */
function openLogistics(row) {
  logisticsTarget.value = row
  logisticsNo.value = row.logisticsNo || ''
  logisticsVisible.value = true
}

/** 填写退货物流 */
async function onFillLogistics() {
  if (!logisticsNo.value.trim()) {
    ElMessage.warning('请填写退货物流单号')
    return
  }
  logisticsSubmitting.value = true
  try {
    await fillLogistics(logisticsTarget.value.id, logisticsNo.value.trim())
    ElMessage.success('退货物流已登记，等待商家确认退款')
    logisticsVisible.value = false
    await load()
  } catch (e) {
    // 拦截器已提示
  } finally {
    logisticsSubmitting.value = false
  }
}

/** 状态标签配色 */
function tagType(status) {
  return ['warning', 'primary', 'success', 'danger', 'info'][status] || 'info'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(load)
</script>

<style scoped>
.after-sale-list-page {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
}

.status-tabs {
  margin: 10px 0;
}

.as-card {
  background: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fafafa;
  padding: 10px 16px;
  font-size: 13px;
  color: #666;
}

.as-no {
  font-weight: 600;
  color: #333;
}

.status {
  margin-left: auto;
  font-weight: 600;
}

.st-0 { color: var(--mall-price); }
.st-1 { color: var(--mall-primary); }
.st-2 { color: #67c23a; }
.st-3 { color: #e6a23c; }
.st-4 { color: #999; }

.card-body {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
}

.type-info {
  flex: 0 0 300px;
  font-size: 13px;
  color: #555;
  line-height: 1.9;
}

.type-info .label {
  color: #999;
}

.amount {
  color: var(--mall-price);
  font-size: 15px;
}

.items {
  flex: 1;
  min-width: 0;
  border-left: 1px dashed #f0f0f0;
  padding-left: 16px;
}

.card-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding: 10px 16px;
}

.pager {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>

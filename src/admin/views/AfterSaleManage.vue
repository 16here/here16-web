<template>
  <!-- 管理端售后管理（阶段 7）：类型/状态筛选 + 售后表格 + 审核弹窗 + 退款操作 -->
  <div class="after-sale-manage">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select v-model="query.type" placeholder="全部类型" clearable style="width: 130px" @change="onSearch">
        <el-option label="仅退款" :value="1" />
        <el-option label="退货退款" :value="2" />
      </el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px" @change="onSearch">
        <el-option label="待审核" :value="0" />
        <el-option label="待寄回" :value="1" />
        <el-option label="已完成" :value="2" />
        <el-option label="已拒绝" :value="3" />
        <el-option label="已撤销" :value="4" />
      </el-select>
      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="loadList">刷新</el-button>
    </div>

    <!-- 售后表格 -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="afterSaleNo" label="售后单号" min-width="190" />
      <el-table-column prop="orderNo" label="订单号" min-width="190" />
      <el-table-column prop="username" label="用户" width="100" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'warning' : 'primary'" size="small">{{ row.typeText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退款金额" width="110">
        <template #default="{ row }">
          <span class="amount">¥{{ Number(row.amount).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="申请原因" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="160">
        <template #default="{ row }">{{ formatTime(row.applyAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <!-- 待审核：审核（通过/拒绝） -->
          <el-button v-if="row.status === 0" link type="success" @click="openAudit(row)">审核</el-button>
          <!-- 待寄回（退货退款已寄回）：确认退款 -->
          <el-button v-if="row.status === 1" link type="warning" @click="onRefund(row)">确认退款</el-button>
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
        @current-change="loadList"
      />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="售后详情" size="520px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="售后单号">{{ detail.afterSaleNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detail.username }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detail.typeText }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detail.status)" size="small">{{ detail.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ detail.orderStatusText }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">¥{{ Number(detail.amount).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="申请原因">{{ detail.reason }}</el-descriptions-item>
          <el-descriptions-item label="退货物流">{{ detail.logisticsNo || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="审核意见">{{ detail.auditRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatTime(detail.applyAt) }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ formatTime(detail.auditAt) }}</el-descriptions-item>
          <el-descriptions-item label="退款时间">{{ formatTime(detail.refundAt) }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="items-title">订单商品</h4>
        <div v-for="(item, index) in detail.items" :key="index" class="detail-item">
          <img :src="item.productImage || '/default-product.svg'" class="item-img" alt="" />
          <div class="item-info">
            <p class="item-name">{{ item.productName }}</p>
            <p v-if="item.skuName" class="item-sku">{{ item.skuName }}</p>
          </div>
          <div class="item-price">¥{{ Number(item.price).toFixed(2) }} × {{ item.quantity }}</div>
        </div>
      </template>
    </el-drawer>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" title="审核售后申请" width="460px">
      <template v-if="auditTarget">
        <div class="audit-info">
          <p>售后单：{{ auditTarget.afterSaleNo }}（{{ auditTarget.typeText }}）</p>
          <p>退款金额：<b class="amount">¥{{ Number(auditTarget.amount).toFixed(2) }}</b></p>
          <p>申请原因：{{ auditTarget.reason }}</p>
        </div>
        <el-form label-width="80px" class="audit-form">
          <el-form-item label="审核意见">
            <el-input
              v-model="auditRemark"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="填写审核意见（拒绝时必填）"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button type="danger" plain :loading="auditing" @click="onAudit(false)">拒绝</el-button>
        <el-button type="primary" :loading="auditing" @click="onAudit(true)">同意</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listAfterSales,
  getAfterSaleDetail,
  auditAfterSale,
  confirmRefund
} from '../api/afterSale'

const list = ref([])
const loading = ref(false)
const total = ref(0)

/** 查询条件 */
const query = reactive({
  type: null,
  status: null,
  page: 1,
  pageSize: 10
})

/** 详情抽屉 */
const detailVisible = ref(false)
const detail = ref(null)

/** 审核弹窗 */
const auditVisible = ref(false)
const auditTarget = ref(null)
const auditRemark = ref('')
const auditing = ref(false)

/** 加载售后列表 */
async function loadList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.type !== null && query.type !== '') params.type = query.type
    if (query.status !== null && query.status !== '') params.status = query.status
    const res = await listAfterSales(params)
    list.value = res.data.list || []
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
  loadList()
}

/** 打开详情抽屉 */
async function openDetail(row) {
  try {
    const res = await getAfterSaleDetail(row.id)
    detail.value = res.data
    detailVisible.value = true
  } catch (e) {
    // 拦截器已提示
  }
}

/** 打开审核弹窗 */
function openAudit(row) {
  auditTarget.value = row
  auditRemark.value = ''
  auditVisible.value = true
}

/**
 * 审核售后单：
 * - approve=true 且仅退款 → 直接退款（完成）；
 * - approve=true 且退货退款 → 待寄回；
 * - approve=false → 拒绝（拒绝时要求填写意见）。
 */
async function onAudit(approve) {
  if (!approve && !auditRemark.value.trim()) {
    ElMessage.warning('拒绝时请填写审核意见')
    return
  }
  auditing.value = true
  try {
    const res = await auditAfterSale(auditTarget.value.id, approve, auditRemark.value.trim())
    const statusText = res.data?.statusText
    ElMessage.success(approve ? `审核通过（${statusText || ''}）` : '已拒绝该售后申请')
    auditVisible.value = false
    await loadList()
  } catch (e) {
    // 拦截器已提示
  } finally {
    auditing.value = false
  }
}

/** 确认收货退款（退货退款链路：待寄回 → 已完成） */
async function onRefund(row) {
  try {
    await ElMessageBox.confirm(
      `确认用户已寄回商品并执行退款 ¥${Number(row.amount).toFixed(2)} 吗？退款后将恢复商品库存。`,
      '确认退款',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }
  try {
    await confirmRefund(row.id)
    ElMessage.success('退款完成，售后单已完结')
    await loadList()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 状态标签配色 */
function statusTagType(status) {
  return ['warning', 'primary', 'success', 'danger', 'info'][status] || 'info'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(loadList)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.amount {
  color: var(--mall-price);
  font-weight: 600;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.items-title {
  margin: 16px 0 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.item-img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sku {
  margin-top: 2px;
  font-size: 12px;
  color: #999;
}

.item-price {
  font-size: 13px;
  color: #666;
}

.audit-info {
  background: #fafafa;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 14px;
}

.audit-form {
  margin-top: 4px;
}
</style>

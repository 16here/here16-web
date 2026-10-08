<template>
  <!-- 管理端支付流水管理：筛选 + 对账统计 + 表格 + 分页 -->
  <div class="payment-manage">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select v-model="query.payMethod" placeholder="全部支付方式" clearable style="width: 150px" @change="onSearch">
        <el-option label="支付宝" value="alipay" />
        <el-option label="微信支付" value="wechat" />
      </el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="onSearch">
        <el-option label="待支付" :value="0" />
        <el-option label="已支付" :value="1" />
        <el-option label="已退款" :value="2" />
        <el-option label="支付失败" :value="3" />
      </el-select>
      <el-input
        v-model="query.keyword"
        placeholder="订单号 / 支付流水号"
        clearable
        style="width: 240px"
        @keyup.enter="onSearch"
      />
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <!-- 对账统计（当前筛选范围） -->
    <el-alert v-if="!loading" type="success" :closable="false" class="summary-bar">
      当前筛选共 {{ total }} 笔支付流水；已支付金额合计 ¥{{ paidTotal.toFixed(2) }}；
      待支付金额合计 ¥{{ pendingTotal.toFixed(2) }}
    </el-alert>

    <!-- 流水表格 -->
    <el-table :data="payments" v-loading="loading" border stripe>
      <el-table-column prop="paymentNo" label="支付流水号" min-width="210" />
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column label="支付方式" width="110">
        <template #default="{ row }">
          {{ row.payMethod === 'alipay' ? '支付宝' : '微信支付' }}
        </template>
      </el-table-column>
      <el-table-column label="金额" width="110">
        <template #default="{ row }">
          <span class="amount">¥{{ Number(row.amount).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="transactionId" label="第三方交易号" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">{{ row.transactionId || '-' }}</template>
      </el-table-column>
      <el-table-column label="支付时间" width="160">
        <template #default="{ row }">{{ formatTime(row.paidAt) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadPayments"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { getPayments } from '../api/payment'

const payments = ref([])
const loading = ref(false)
const total = ref(0)

/** 查询条件 */
const query = reactive({
  payMethod: null,
  status: null,
  keyword: '',
  page: 1,
  pageSize: 10
})

/** 对账：已支付金额合计（当前筛选结果） */
const paidTotal = computed(() =>
  payments.value
    .filter((p) => p.status === 1)
    .reduce((s, p) => s + Number(p.amount || 0), 0)
)

/** 对账：待支付金额合计 */
const pendingTotal = computed(() =>
  payments.value
    .filter((p) => p.status === 0)
    .reduce((s, p) => s + Number(p.amount || 0), 0)
)

/** 加载流水列表 */
async function loadPayments() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.payMethod) params.payMethod = query.payMethod
    if (query.status !== null && query.status !== '') params.status = query.status
    if (query.keyword) params.keyword = query.keyword
    const res = await getPayments(params)
    payments.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 查询按钮：回到第一页 */
function onSearch() {
  query.page = 1
  loadPayments()
}

/** 状态文案 */
function statusText(status) {
  return ['待支付', '已支付', '已退款', '支付失败'][status] || '未知'
}

/** 状态标签配色 */
function statusTagType(status) {
  return ['warning', 'success', 'info', 'danger'][status] || 'info'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(loadPayments)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.summary-bar {
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
</style>

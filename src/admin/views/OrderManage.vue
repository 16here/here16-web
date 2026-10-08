<template>
  <!-- 管理端订单管理：状态筛选 + 订单号搜索 + 表格 + 详情抽屉 + 发货 -->
  <div class="order-manage">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="onSearch">
        <el-option label="待付款" :value="0" />
        <el-option label="待发货" :value="1" />
        <el-option label="待收货" :value="2" />
        <el-option label="已完成" :value="3" />
        <el-option label="已取消" :value="4" />
      </el-select>
      <el-input
        v-model="query.keyword"
        placeholder="订单号搜索"
        clearable
        style="width: 240px"
        @keyup.enter="onSearch"
      />
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <!-- 订单表格 -->
    <el-table :data="orders" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="200" />
      <el-table-column prop="username" label="下单人" width="110" />
      <el-table-column label="金额" width="110">
        <template #default="{ row }">
          <span class="amount">¥{{ Number(row.totalAmount).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 1" link type="success" @click="openShip(row)">发货</el-button>
          <el-button v-if="row.status === 0" link type="danger" @click="onClose(row)">关闭</el-button>
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
        @current-change="loadOrders"
      />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="订单详情" size="480px">
      <template v-if="detail">
        <el-descriptions :column="1" border>          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="下单人">{{ detail.username }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detail.status)" size="small">{{ detail.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ Number(detail.totalAmount).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detail.receiverName }}（{{ detail.receiverPhone }}）</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ detail.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ detail.shippingNo || '未发货' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 状态流转时间轴（阶段 5） -->
        <template v-if="detail.statusLogs && detail.statusLogs.length">
          <h4 class="items-title">状态流转</h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in detail.statusLogs"
              :key="log.id"
              :timestamp="formatTime(log.createdAt)"
              placement="top"
            >
              <p class="log-line">
                {{ log.fromStatusText }} → <b>{{ log.toStatusText }}</b>
                <el-tag size="small" type="info">{{ log.event }}</el-tag>
              </p>
              <p class="log-remark">{{ log.remark }}（{{ operatorText(log.operatorType) }}）</p>
            </el-timeline-item>
          </el-timeline>
        </template>

        <h4 class="items-title">商品明细</h4>
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
    <!-- 发货弹窗（阶段 5 填单号 → 阶段 9 升级：快递公司 + 单号，创建正式运单） -->
    <el-dialog v-model="shipVisible" title="订单发货" width="440px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="订单号">
          <span>{{ shipTarget?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="快递公司" required>
          <el-select v-model="shippingCompany" placeholder="请选择快递公司" style="width: 100%">
            <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shippingNo" placeholder="请输入快递单号，如 SF1234567890" maxlength="64" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="onShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, getOrderDetail, closeOrder } from '../api/order'
import { shipShipping } from '../api/shipping'

const orders = ref([])
const loading = ref(false)
const total = ref(0)
const drawerVisible = ref(false)
const detail = ref(null)

/** 发货弹窗状态（阶段 9：快递公司 + 单号 → 创建运单） */
const shipVisible = ref(false)
const shipTarget = ref(null)
const shippingCompany = ref('')
const shippingNo = ref('')
const shipping = ref(false)
/** 可选快递公司（与后端 ShippingService 编码映射一致） */
const companies = ['顺丰', '中通', '圆通', '韵达', '申通', '京东', '邮政EMS']

/** 查询条件 */
const query = reactive({
  status: null,
  keyword: '',
  page: 1,
  pageSize: 10
})

/** 加载订单列表 */
async function loadOrders() {
  loading.value = true
  try {
    const params = {
      page: query.page,
      pageSize: query.pageSize
    }
    if (query.status !== null && query.status !== '') params.status = query.status
    if (query.keyword) params.keyword = query.keyword
    const res = await getOrders(params)
    orders.value = res.data.list || []
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
  loadOrders()
}

/** 打开详情抽屉 */
async function openDetail(row) {
  try {
    const res = await getOrderDetail(row.id)
    detail.value = res.data
    drawerVisible.value = true
  } catch (e) {
    // 拦截器已提示
  }
}

/** 打开发货弹窗（阶段 9） */
function openShip(row) {
  shipTarget.value = row
  shippingCompany.value = ''
  shippingNo.value = ''
  shipVisible.value = true
}

/** 确认发货（快递公司 + 单号 → 创建运单 + 订单状态流转 待发货→待收货） */
async function onShip() {
  if (!shippingCompany.value) {
    ElMessage.warning('请选择快递公司')
    return
  }
  if (!shippingNo.value.trim()) {
    ElMessage.warning('请填写快递单号')
    return
  }
  shipping.value = true
  try {
    await shipShipping({
      orderId: shipTarget.value.id,
      shippingCompany: shippingCompany.value,
      trackingNo: shippingNo.value.trim()
    })
    ElMessage.success('已发货，运单已创建')
    shipVisible.value = false
    await loadOrders()
  } catch (e) {
    // 拦截器已提示
  } finally {
    shipping.value = false
  }
}

/** 关闭订单（阶段 5：仅待付款订单，恢复库存） */
async function onClose(row) {
  try {
    await ElMessageBox.confirm(
      `确认关闭订单 ${row.orderNo} 吗？关闭后订单取消并恢复商品库存。`,
      '关闭订单',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }
  try {
    await closeOrder(row.id)
    ElMessage.success('订单已关闭')
    await loadOrders()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 操作方中文（状态日志展示） */
function operatorText(type) {
  return { USER: '用户', ADMIN: '管理员', SYSTEM: '系统' }[type] || type
}

/** 状态标签配色 */
function statusTagType(status) {
  return ['danger', 'warning', 'primary', 'success', 'info'][status] || 'info'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(loadOrders)
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
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-price {
  font-size: 13px;
  color: #666;
}

.log-line {
  font-size: 13px;
  color: #333;
}

.log-remark {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>

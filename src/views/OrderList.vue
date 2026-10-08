<template>
  <!-- 我的订单页（参考淘宝"我的订单"）：状态 Tab + 订单卡片 + 分页 -->
  <div v-loading="loading" class="page-container order-list-page">
    <div class="page-head">
      <h2>我的订单</h2>
    </div>

    <!-- 状态 Tab -->
    <el-tabs v-model="activeStatus" class="status-tabs" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="待收货" name="2" />
      <el-tab-pane label="已完成" name="3" />
      <el-tab-pane label="已取消" name="4" />
    </el-tabs>

    <!-- 订单卡片 -->
    <template v-if="orders.length > 0">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <!-- 卡片头：订单号 + 时间 + 状态 -->
        <div class="card-head">
          <span class="order-no">订单号：{{ order.orderNo }}</span>
          <span class="time">{{ formatTime(order.createdAt) }}</span>
          <span class="status" :class="`st-${order.status}`">{{ order.statusText }}</span>
        </div>

        <!-- 商品明细（列表接口已带 items） -->
        <div class="items">
          <OrderItemCard v-for="item in order.items" :key="item.productId + item.skuId" :item="item" />
        </div>

        <!-- 卡片尾：合计 + 操作按钮 -->
        <div class="card-foot">
          <span class="count">共 {{ countItems(order) }} 件</span>
          <span class="total">
            实付：<b>¥{{ Number(order.totalAmount).toFixed(2) }}</b>
          </span>
          <div class="ops">
            <router-link :to="`/order/${order.id}`">
              <el-button size="small">订单详情</el-button>
            </router-link>
            <!-- 阶段 5：按状态显示操作（淘宝"我的订单"交互）：
                 待付款→立即支付/取消；待发货→取消；待收货→确认收货 -->
            <el-button v-if="order.status === 0" size="small" type="danger" @click="goPay(order)">
              立即付款
            </el-button>
            <el-button v-if="order.status === 0 || order.status === 1" size="small" type="danger" plain @click="onCancel(order)">
              取消订单
            </el-button>
            <el-button v-if="order.status === 2" size="small" type="primary" @click="onConfirm(order)">
              确认收货
            </el-button>
            <!-- 阶段 7：已完成可评价晒单；待发货/待收货/已完成可申请售后 -->
            <el-button v-if="order.status === 3" size="small" type="warning" @click="goReview(order)">
              评价晒单
            </el-button>
            <el-button v-if="[1, 2, 3].includes(order.status)" size="small" type="danger" plain @click="goAfterSale(order)">
              申请售后
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadOrders"
        />
      </div>
    </template>

    <el-empty v-else-if="!loading" description="暂无相关订单" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, cancelOrder, confirmOrder } from '../api/order'
import OrderItemCard from '../components/OrderItemCard.vue'

const router = useRouter()

const orders = ref([])
const loading = ref(false)
const activeStatus = ref('all')
const page = ref(1)
const pageSize = 10
const total = ref(0)

/** 加载订单列表 */
async function loadOrders() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (activeStatus.value !== 'all') {
      params.status = Number(activeStatus.value)
    }
    const res = await getOrders(params)
    orders.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 切换状态 Tab：回到第一页重新加载 */
function onTabChange() {
  page.value = 1
  loadOrders()
}

/** 取消订单（确认弹窗） */
async function onCancel(order) {
  try {
    await ElMessageBox.confirm(
      `确定取消订单 ${order.orderNo} 吗？取消后商品库存将恢复。`,
      '取消订单',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }
  try {
    await cancelOrder(order.id)
    ElMessage.success('订单已取消')
    await loadOrders()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 去收银台支付（待付款订单） */
function goPay(order) {
  router.push(`/pay/${order.id}`)
}

/** 去评价晒单页（阶段 7） */
function goReview(order) {
  router.push(`/order/review/${order.id}`)
}

/** 去申请售后页（阶段 7，携带订单号便于定位） */
function goAfterSale(order) {
  router.push({ path: '/after-sales/apply', query: { orderId: order.id } })
}

/** 确认收货（真实调用状态机 CONFIRM，阶段 5 上线） */
async function onConfirm(order) {
  try {
    await ElMessageBox.confirm(
      `请确认已收到订单 ${order.orderNo} 的商品，确认后订单完成。`,
      '确认收货',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }
  try {
    await confirmOrder(order.id)
    ElMessage.success('确认收货成功，交易完成')
    await loadOrders()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 统计订单总件数 */
function countItems(order) {
  return (order.items || []).reduce((s, it) => s + it.quantity, 0)
}

/** 时间显示（去掉毫秒与 T） */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(loadOrders)
</script>

<style scoped>
.order-list-page {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
}

.status-tabs {
  margin: 10px 0;
}

.order-card {
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

.status {
  margin-left: auto;
  font-weight: 600;
}

.st-0 { color: var(--mall-price); }
.st-1 { color: var(--mall-primary); }
.st-2 { color: var(--mall-primary); }
.st-3 { color: #67c23a; }
.st-4 { color: #999; }

.items {
  padding: 8px 16px;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  font-size: 13px;
  color: #666;
}

.total b {
  font-size: 16px;
  color: var(--mall-price);
}

.pager {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>

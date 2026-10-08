<template>
  <!-- 订单详情页：状态横幅 + 收货信息 + 商品明细 + 金额/订单信息 -->
  <div v-loading="loading" class="page-container detail-page">
    <div class="crumb">
      <router-link to="/orders">我的订单</router-link>
      <span class="sep">/</span>
      <span>订单详情</span>
    </div>

    <template v-if="order">
      <!-- 状态横幅 -->
      <div class="status-banner">
        <div>
          <h2 class="status-text">{{ order.statusText }}</h2>
          <p class="status-desc">{{ statusDesc }}</p>
        </div>
        <div class="ops">
          <router-link to="/orders">
            <el-button>返回订单列表</el-button>
          </router-link>
          <el-button v-if="order.status === 0" type="danger" @click="goPay">立即支付</el-button>
          <el-button v-if="order.status === 0 || order.status === 1" type="danger" plain @click="onCancel">
            取消订单
          </el-button>
          <el-button v-if="order.status === 2" type="success" @click="goLogistics">查看物流</el-button>
          <el-button v-if="order.status === 2" type="primary" @click="onConfirm">确认收货</el-button>
          <!-- 阶段 7：已完成可评价；待发货/待收货/已完成可申请售后 -->
          <el-button v-if="order.status === 3" type="warning" @click="goReview">评价晒单</el-button>
          <el-button v-if="[1, 2, 3].includes(order.status)" type="danger" plain @click="goAfterSale">
            申请售后
          </el-button>
        </div>
      </div>

      <!-- 状态进度（阶段 5：订单生命周期时间轴，数据来自后端状态日志） -->
      <div class="block">
        <div class="block-title">订单进度</div>
        <div class="timeline">
          <template v-for="(log, idx) in timeline" :key="idx">
            <div class="tl-node" :class="{ done: log.done, current: log.current }">
              <span class="dot"></span>
              <div class="tl-body">
                <p class="tl-title" :class="{ current: log.current }">{{ log.title }}</p>
                <p class="tl-time">{{ log.time }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 收货信息（地址快照） -->
      <div class="block">
        <div class="block-title">收货信息</div>
        <p class="receiver">
          {{ order.receiverName }} <span>{{ order.receiverPhone }}</span>
        </p>
        <p class="addr">{{ order.receiverAddress }}</p>
      </div>

      <!-- 商品明细 -->
      <div class="block">
        <div class="block-title">商品明细</div>
        <OrderItemCard v-for="item in order.items" :key="item.productId + item.skuId" :item="item" />
      </div>

      <!-- 金额与订单信息 -->
      <div class="block">
        <div class="block-title">订单信息</div>
        <div class="meta-grid">
          <p><span class="label">订单号：</span>{{ order.orderNo }}</p>
          <p><span class="label">下单时间：</span>{{ formatTime(order.createdAt) }}</p>
          <p v-if="order.paidAt"><span class="label">付款时间：</span>{{ formatTime(order.paidAt) }}</p>
          <p v-if="order.shippedAt"><span class="label">发货时间：</span>{{ formatTime(order.shippedAt) }}</p>
          <p v-if="order.shippingNo"><span class="label">物流单号：</span>{{ order.shippingNo }}</p>
          <p v-if="order.completedAt"><span class="label">完成时间：</span>{{ formatTime(order.completedAt) }}</p>
          <p v-if="order.cancelledAt"><span class="label">取消时间：</span>{{ formatTime(order.cancelledAt) }}</p>
          <p><span class="label">买家备注：</span>{{ order.remark || '无' }}</p>
        </div>
        <div class="amount-box">
          <span>商品金额：</span>
          <b>¥{{ Number(order.totalAmount).toFixed(2) }}</b>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="订单不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, cancelOrder, confirmOrder } from '../api/order'
import OrderItemCard from '../components/OrderItemCard.vue'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(false)

/**
 * 订单进度时间轴（阶段 5：由后端状态日志 statusLogs 生成）。
 * 始终显示 5 个阶段节点，已完成/进行中的节点高亮：
 * 下单(createdAt) → 付款 → 发货 → 完成 → 取消
 */
const timeline = computed(() => {
  const o = order.value
  if (!o) return []
  const logs = o.statusLogs || []
  const nodes = [
    { title: '提交订单', time: o.createdAt, done: true, current: o.status === 0 }
  ]
  // 取消时：进度停在取消节点
  if (o.status === 4) {
    nodes.push({ title: '订单取消', time: o.cancelledAt, done: true, current: true })
    return nodes
  }
  const paid = logs.find((l) => l.event === 'PAY')
  const shipped = logs.find((l) => l.event === 'SHIP')
  const confirmed = logs.find((l) => l.event === 'CONFIRM')
  nodes.push({ title: '付款成功', time: paid ? paid.createdAt : o.paidAt, done: !!paid, current: o.status === 1 })
  nodes.push({ title: '商家发货', time: shipped ? shipped.createdAt : o.shippedAt, done: !!shipped, current: o.status === 2 })
  nodes.push({ title: '交易完成', time: confirmed ? confirmed.createdAt : o.completedAt, done: !!confirmed, current: o.status === 3 })
  return nodes
})

/** 状态描述（引导文案） */
const statusDesc = computed(() => {
  switch (order.value?.status) {
    case 0: return '订单已提交，请尽快完成付款'
    case 1: return '商家正在准备发货，请耐心等待'
    case 2: return '商品已发出，请注意查收'
    case 3: return '交易已完成，感谢您的购买'
    case 4: return '订单已取消'
    default: return ''
  }
})

/** 加载订单详情 */
async function loadDetail(id) {
  loading.value = true
  try {
    const res = await getOrderDetail(id)
    order.value = res.data
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 取消订单 */
async function onCancel() {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？取消后商品库存将恢复。', '取消订单', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await cancelOrder(order.value.id)
    ElMessage.success('订单已取消')
    await loadDetail(route.params.id)
  } catch (e) {
    // 拦截器已提示
  }
}

/** 确认收货（阶段 5：真实调用状态机 CONFIRM） */
async function onConfirm() {
  try {
    await ElMessageBox.confirm('请确认已收到全部商品，确认后交易完成。', '确认收货', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await confirmOrder(order.value.id)
    ElMessage.success('确认收货成功，交易完成')
    await loadDetail(route.params.id)
  } catch (e) {
    // 拦截器已提示
  }
}

/** 去收银台支付 */
function goPay() {
  router.push(`/pay/${order.value.id}`)
}

/** 查看物流（阶段 9：待收货订单跳物流轨迹页） */
function goLogistics() {
  router.push(`/logistics/${order.value.id}`)
}

/** 去评价晒单页（阶段 7） */
function goReview() {
  router.push(`/order/review/${order.value.id}`)
}

/** 去申请售后页（阶段 7，携带订单号便于定位） */
function goAfterSale() {
  router.push({ path: '/after-sales/apply', query: { orderId: order.value.id } })
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadDetail(route.params.id)
})
</script>

<style scoped>
.detail-page {
  min-height: 70vh;
  padding-top: 16px;
}

.crumb {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.crumb a {
  color: var(--mall-primary);
  text-decoration: none;
}

.sep {
  margin: 0 6px;
  color: #ccc;
}

/* 状态横幅 */
.status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, var(--mall-primary-light), #fff);
  border-radius: 6px;
  padding: 20px 24px;
  margin-bottom: 14px;
}

.status-text {
  font-size: 22px;
  color: var(--mall-primary);
}

.status-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}

.block {
  background: #fff;
  border-radius: 6px;
  padding: 18px;
  margin-bottom: 14px;
}

.block-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid var(--mall-primary);
}

.receiver {
  font-size: 14px;
  color: #333;
}

.receiver span {
  color: #666;
  margin-left: 10px;
}

.addr {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}

.meta-grid p {
  font-size: 13px;
  color: #555;
  line-height: 1.9;
}

.meta-grid .label {
  color: #999;
}

.amount-box {
  margin-top: 14px;
  text-align: right;
  border-top: 1px dashed #eee;
  padding-top: 14px;
  font-size: 14px;
  color: #333;
}

.amount-box b {
  font-size: 22px;
  color: var(--mall-price);
}

/* 订单进度时间轴（阶段 5） */
.timeline {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
}

.tl-node {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  flex: 1;
  min-width: 0;
}

.tl-node:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 22px;
  right: 0;
  border-top: 2px solid #eee;
}

.tl-node.done:not(:last-child)::after {
  border-color: var(--mall-primary);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  background: #fff;
  margin-top: 3px;
  flex-shrink: 0;
}

.tl-node.done .dot {
  border-color: var(--mall-primary);
  background: var(--mall-primary);
}

.tl-node.current .dot {
  border-color: var(--mall-price);
  background: var(--mall-price);
  box-shadow: 0 0 0 3px rgba(255, 80, 0, 0.15);
}

.tl-body {
  min-width: 0;
}

.tl-title {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
}

.tl-node.done .tl-title {
  color: #333;
}

.tl-title.current {
  color: var(--mall-price);
  font-weight: 600;
}

.tl-time {
  font-size: 12px;
  color: #bbb;
  margin-top: 2px;
  white-space: nowrap;
}
</style>

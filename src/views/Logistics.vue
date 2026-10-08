<template>
  <!-- 物流跟踪页（阶段 9）：运单信息 + 轨迹时间轴 + 商品摘要，淘宝物流详情风格 -->
  <div v-loading="loading" class="page-container logistics-page">
    <div class="crumb">
      <router-link to="/orders">我的订单</router-link>
      <span class="sep">/</span>
      <router-link :to="`/order/${orderId}`">订单详情</router-link>
      <span class="sep">/</span>
      <span>物流跟踪</span>
    </div>

    <template v-if="shipping">
      <!-- 运单信息卡 -->
      <div class="ship-card">
        <div class="ship-left">
          <span class="company">{{ shipping.shippingCompany }}</span>
          <span class="tracking-no">运单号：{{ shipping.trackingNo }}</span>
          <span class="ship-time">发货时间：{{ formatTime(shipping.createdAt) }}</span>
        </div>
        <div class="ship-right">
          <span class="status-badge" :class="'st' + shipping.status">{{ shipping.statusText }}</span>
        </div>
      </div>

      <!-- 物流轨迹时间轴（最新在顶部，淘宝物流页风格） -->
      <div class="block">
        <div class="block-title">物流动态</div>
        <div v-if="traces.length" class="trace-list">
          <div
            v-for="(t, idx) in traces"
            :key="t.id"
            class="trace-node"
            :class="{ latest: idx === 0 }"
          >
            <div class="trace-line">
              <span class="dot" :class="{ done: idx !== traces.length - 1 || shipping.status === 2 }"></span>
              <span v-if="idx < traces.length - 1" class="line"></span>
            </div>
            <div class="trace-body">
              <p class="trace-info" :class="{ strong: idx === 0 }">{{ t.trackInfo }}</p>
              <p class="trace-meta">
                <span class="trace-loc" v-if="t.location">{{ t.location }}</span>
                <span class="trace-time">{{ formatTime(t.trackTime) }}</span>
              </p>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无物流轨迹，请稍后刷新" :image-size="80" />
      </div>

      <!-- 商品摘要 -->
      <div class="block" v-if="order">
        <div class="block-title">商品信息</div>
        <div class="goods-row">
          <img
            class="goods-img"
            :src="order.items[0]?.productImage || defaultImg"
            alt="商品图"
            @error="(e) => (e.target.src = defaultImg)"
          />
          <div class="goods-info">
            <p class="goods-name">{{ order.items[0]?.productName || '商品' }}</p>
            <p class="goods-sku">
              规格：{{ order.items[0]?.skuName || '默认' }} × {{ order.items[0]?.quantity || 1 }}
            </p>
          </div>
        </div>
        <router-link :to="`/order/${orderId}`" class="back-link">返回订单详情 →</router-link>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="暂无物流信息" :image-size="100" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getShipping } from '../api/shipping'
import { getOrderDetail } from '../api/order'

const route = useRoute()
const orderId = route.params.orderId

const shipping = ref(null)
const order = ref(null)
const loading = ref(false)
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f5f5f5"/><text x="40" y="46" text-anchor="middle" font-size="14" fill="%23ccc">暂无图片</text></svg>'

/** 轨迹按时间倒序展示（最新在前），后端返回正序 → 反转 */
const traces = computed(() => {
  const list = shipping.value?.traces || []
  return [...list].reverse()
})

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 加载物流信息 + 订单商品摘要 */
async function load() {
  loading.value = true
  try {
    const res = await getShipping(orderId)
    shipping.value = res.data
    try {
      const o = await getOrderDetail(orderId)
      order.value = o.data
    } catch (e) {
      // 商品摘要加载失败不影响物流展示
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.logistics-page {
  max-width: 1000px;
}

/* 运单信息卡 */
.ship-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff7f0 0%, #ffffff 60%);
  border: 1px solid #ffe3d1;
  border-radius: 8px;
  padding: 18px 22px;
  margin-bottom: 16px;
}
.ship-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.company {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}
.tracking-no,
.ship-time {
  font-size: 13px;
  color: #888;
}
.status-badge {
  font-size: 14px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 20px;
}
.status-badge.st0 {
  background: #fff7e6;
  color: #f0a020;
}
.status-badge.st1 {
  background: #fff0e6;
  color: #ff5000;
}
.status-badge.st2 {
  background: #f0f9eb;
  color: #52c41a;
}

/* 轨迹时间轴 */
.trace-list {
  padding: 6px 4px;
}
.trace-node {
  display: flex;
  gap: 14px;
  position: relative;
}
.trace-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 14px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d9d9d9;
  flex-shrink: 0;
  margin-top: 5px;
  z-index: 1;
}
.dot.done {
  background: #ff5000;
}
.trace-node.latest .dot {
  width: 12px;
  height: 12px;
  background: #ff5000;
  box-shadow: 0 0 0 4px rgba(255, 80, 0, 0.15);
}
.line {
  width: 2px;
  flex: 1;
  background: #ffe0d0;
  margin: 2px 0;
}
.trace-body {
  padding-bottom: 22px;
  min-width: 0;
}
.trace-info {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin: 0;
}
.trace-info.strong {
  color: #222;
  font-weight: 600;
}
.trace-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #aaa;
}

/* 商品摘要 */
.goods-row {
  display: flex;
  gap: 14px;
  align-items: center;
}
.goods-img {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
  border: 1px solid #eee;
}
.goods-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 6px;
}
.goods-sku {
  font-size: 12px;
  color: #999;
  margin: 0;
}
.back-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 13px;
  color: #ff5000;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
</style>

<template>
  <!-- 支付结果页：成功 / 失败 / 处理中 三态 -->
  <div class="page-container result-page">
    <div class="result-card">
      <!-- 成功 -->
      <template v-if="status === 'success'">
        <div class="icon success">✓</div>
        <h2 class="title">支付成功</h2>
        <p class="sub">您已成功支付本笔订单，商家将尽快发货</p>
        <div class="amount-box">¥{{ formatAmount(amount) }}</div>
        <div class="btn-row">
          <el-button type="primary" size="large" @click="goOrder">查看订单详情</el-button>
          <el-button size="large" @click="goHome">返回首页</el-button>
        </div>
      </template>

      <!-- 失败 -->
      <template v-else-if="status === 'fail'">
        <div class="icon fail">×</div>
        <h2 class="title">支付失败</h2>
        <p class="sub">支付未完成，您可以重新发起支付</p>
        <div class="btn-row">
          <el-button type="danger" size="large" @click="goPay">重新支付</el-button>
          <el-button size="large" @click="goOrder">查看订单详情</el-button>
        </div>
      </template>

      <!-- 处理中 -->
      <template v-else>
        <div class="icon pending">
          <span class="spin" />
        </div>
        <h2 class="title">支付处理中</h2>
        <p class="sub">请稍候，正在确认支付结果…</p>
        <div class="btn-row">
          <el-button size="large" @click="goOrder">查看订单详情</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * 支付结果页。
 * 路由 query：status(success/fail/pending)、orderId、paymentNo、amount。
 */
const route = useRoute()
const router = useRouter()

const status = computed(() => route.query.status || 'pending')
const orderId = Number(route.query.orderId)
const amount = route.query.amount

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

/** 查看订单详情（有订单 id 时） */
function goOrder() {
  if (orderId) {
    router.push(`/order/${orderId}`)
  } else {
    router.push('/orders')
  }
}

/** 重新支付 */
function goPay() {
  if (orderId) {
    router.push(`/pay/${orderId}`)
  } else {
    router.push('/orders')
  }
}

/** 返回首页 */
function goHome() {
  router.push('/')
}
</script>

<style scoped>
.result-page {
  min-height: 70vh;
  padding-top: 30px;
}

.result-card {
  max-width: 520px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 40px 30px;
  text-align: center;
}

.icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  color: #fff;
}

.icon.success { background: #67c23a; }
.icon.fail { background: var(--mall-price); }
.icon.pending { background: var(--mall-primary); }

.spin {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rot 0.9s linear infinite;
}

@keyframes rot {
  to { transform: rotate(360deg); }
}

.title {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.sub {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.amount-box {
  font-size: 30px;
  font-weight: 700;
  color: var(--mall-price);
  margin-bottom: 26px;
}

.btn-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>

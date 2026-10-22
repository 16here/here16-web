<template>
  <!-- 收银台（参考淘宝支付页）：订单金额 + 支付方式选择 + 倒计时 + 支付区 -->
  <div v-loading="loading" class="page-container pay-page">
    <!-- 顶部流程条 -->
    <div class="pay-steps">
      <span class="done">1 确认订单</span>
      <span class="arrow">›</span>
      <span class="active">2 收银台</span>
      <span class="arrow">›</span>
      <span class="todo">3 支付完成</span>
    </div>

    <template v-if="order">
      <!-- 金额卡片 -->
      <div class="amount-card">
        <div class="amount-row">
          <span class="label">需支付金额</span>
          <span class="amount">¥{{ Number(order.totalAmount).toFixed(2) }}</span>
        </div>
        <div class="order-info">
          订单号：{{ order.orderNo }}（<router-link :to="`/order/${order.id}`">订单详情</router-link>）
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div class="method-card">
        <div class="method-title">选择支付方式</div>
        <div class="method-list">
          <label
            class="method-item"
            :class="{ active: payMethod === 'alipay' }"
            @click="payMethod = 'alipay'"
          >
            <span class="logo alipay-logo">支</span>
            <span class="name">支付宝</span>
            <span class="check" />
          </label>
          <label
            class="method-item"
            :class="{ active: payMethod === 'wechat' }"
            @click="payMethod = 'wechat'"
          >
            <span class="logo wechat-logo">微</span>
            <span class="name">微信支付</span>
            <span class="check" />
          </label>
        </div>
      </div>

      <!-- 发起支付按钮（未支付时） -->
      <div v-if="!payment" class="pay-btn-row">
        <el-button type="danger" size="large" :loading="creating" @click="onCreatePayment">
          立即支付
        </el-button>
        <span class="timeout-tip">请在 15 分钟内完成支付，超时订单将自动取消</span>
      </div>

      <!-- 支付展示区（已发起支付） -->
      <div v-else class="paying-card">
        <div v-if="payment.mock" class="mock-box">
          <div class="qr-placeholder">
            <span class="qr-logo">{{ payMethod === 'alipay' ? '支' : '微' }}</span>
            <span class="qr-text">模拟支付二维码</span>
          </div>
          <p class="mock-tip">
            演示环境（mock 模式）：扫码页由支付平台提供，此处展示模拟二维码。
            点击下方按钮模拟"扫码支付成功"。
          </p>
          <el-button type="success" size="large" :loading="paying" @click="onMockPay">
            模拟扫码支付成功
          </el-button>
          <div class="countdown" :class="{ expired: countdown <= 0 }">
            <template v-if="countdown > 0">
              支付倒计时：{{ mm }}:{{ ss }}（支付凭证 {{ payment.expireSeconds }} 秒有效）
            </template>
            <template v-else>支付超时，请重新发起支付</template>
          </div>
        </div>
        <div v-else class="real-box">
          <p class="real-tip">正在跳转 {{ payMethod === 'alipay' ? '支付宝' : '微信支付' }} 收银台…</p>
          <div class="countdown">
            支付倒计时：{{ mm }}:{{ ss }}
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="订单不存在或已支付" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '../api/order'
import { createPayment, mockCallback } from '../api/payment'

const route = useRoute()
const router = useRouter()

// 订单 ID 保持字符串原样透传（雪花 ID 19 位，Number() 会丢精度导致后端查不到"订单不存在"）
const orderId = route.params.orderId
const order = ref(null)
const loading = ref(false)
const creating = ref(false)
const paying = ref(false)

const payMethod = ref('alipay')
const payment = ref(null)   // createPayment 返回的支付凭证

// ---------- 倒计时 ----------
const countdown = ref(0)
let timer = null

const mm = computed(() => String(Math.floor(countdown.value / 60)).padStart(2, '0'))
const ss = computed(() => String(countdown.value % 60).padStart(2, '0'))

function startCountdown(seconds) {
  stopCountdown()
  countdown.value = seconds
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

function stopCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 加载订单：仅待付款可进入收银台 */
async function loadOrder() {
  loading.value = true
  try {
    const res = await getOrderDetail(orderId)
    order.value = res.data
    if (order.value.status !== 0) {
      ElMessage.warning('订单当前状态不可支付')
      router.replace(`/order/${orderId}`)
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 发起支付：后端创建流水并返回支付凭证 */
async function onCreatePayment() {
  creating.value = true
  try {
    const res = await createPayment(orderId, { payMethod: payMethod.value })
    payment.value = res.data
    startCountdown(res.data.expireSeconds || 1800)
    if (!res.data.mock) {
      // 真实模式：跳转支付平台收银台
      ElMessage.info('正在跳转支付收银台…')
      // window.location.href = res.data.payUrl  // 接入真实支付后启用
    }
  } catch (e) {
    // 拦截器已提示（如订单已取消）
  } finally {
    creating.value = false
  }
}

/** 模拟扫码支付成功（仅 mock 模式）：把模拟回调参数发给后端，等价于支付平台回调 */
async function onMockPay() {
  paying.value = true
  try {
    const resp = await mockCallback(payMethod.value, {
      paymentNo: payment.value.paymentNo,
      // 金额必须保留两位小数（398.00），与后端签发 mockSign 时的原始格式一致，
      // 否则 JSON 数字 398 会因精度丢失导致 SHA-256 验签失败
      amount: Number(payment.value.amount).toFixed(2),
      tradeNo: `MOCK${Date.now()}`,
      mockSign: payment.value.mockSign
    })
    // 回调接口返回纯文本 success/fail（独立 axios 实例，不走统一 JSON 拦截器）
    if (resp.data === 'success') {
      ElMessage.success('支付成功')
      router.replace({
        path: '/pay/result',
        query: { status: 'success', orderId, paymentNo: payment.value.paymentNo, amount: payment.value.amount }
      })
    } else {
      ElMessage.error('模拟支付失败，请重试')
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    paying.value = false
  }
}

onMounted(loadOrder)
onBeforeUnmount(stopCountdown)
</script>

<style scoped>
.pay-page {
  min-height: 70vh;
  padding-top: 16px;
  max-width: 720px;
}

/* 流程条 */
.pay-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-size: 14px;
}

.pay-steps .done { color: var(--mall-primary); }
.pay-steps .active { color: #333; font-weight: 600; }
.pay-steps .todo { color: #999; }
.pay-steps .arrow { color: #ccc; }

/* 金额卡片 */
.amount-card {
  background: #fff;
  border-radius: 6px;
  padding: 20px 24px;
  margin-bottom: 14px;
}

.amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.amount-row .label { font-size: 14px; color: #666; }

.amount-row .amount {
  font-size: 30px;
  font-weight: 700;
  color: var(--mall-price);
}

.order-info {
  margin-top: 10px;
  font-size: 13px;
  color: #999;
}

.order-info a {
  color: var(--mall-primary);
  text-decoration: none;
}

/* 支付方式 */
.method-card {
  background: #fff;
  border-radius: 6px;
  padding: 18px 24px;
  margin-bottom: 14px;
}

.method-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
}

.method-list {
  display: flex;
  gap: 12px;
}

.method-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
}

.method-item.active {
  border-color: var(--mall-primary);
  box-shadow: 0 0 0 1px var(--mall-primary);
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alipay-logo { background: #1677ff; }
.wechat-logo { background: #07c160; }

.name { font-size: 14px; color: #333; }

.check {
  position: absolute;
  right: 12px;
  width: 18px;
  height: 18px;
  border: 1px solid #ccc;
  border-radius: 50%;
}

.method-item.active .check {
  border-color: var(--mall-primary);
  background: var(--mall-primary);
  box-shadow: inset 0 0 0 3px #fff;
}

/* 发起支付 */
.pay-btn-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timeout-tip { font-size: 12px; color: #999; }

/* 支付展示区 */
.paying-card {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
}

.qr-placeholder {
  width: 180px;
  height: 180px;
  margin: 0 auto 14px;
  border: 1px dashed var(--mall-primary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fffaf5;
}

.qr-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--mall-primary);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-text { font-size: 12px; color: #999; }

.mock-tip {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0 auto 14px;
  max-width: 420px;
}

.real-tip {
  font-size: 14px;
  color: #666;
  margin-bottom: 14px;
}

.countdown {
  margin-top: 14px;
  font-size: 13px;
  color: var(--mall-primary);
}

.countdown.expired { color: var(--mall-price); }
</style>

<template>
  <!-- 申请售后页（阶段 7）：选择订单 → 售后类型 → 原因/金额 → 提交 -->
  <div v-loading="loading" class="page-container apply-page">
    <div class="crumb">
      <router-link to="/after-sales">我的售后</router-link>
      <span class="sep">/</span>
      <span>申请售后</span>
    </div>

    <div class="apply-card">
      <h3 class="card-title">申请售后</h3>

      <!-- 第 1 步：选择订单（待发货/待收货/已完成订单可售后） -->
      <div class="form-row">
        <span class="label">选择订单：</span>
        <el-select
          v-model="form.orderId"
          placeholder="请选择要售后处理的订单"
          style="width: 360px"
          filterable
          @change="onOrderChange"
        >
          <el-option
            v-for="order in availableOrders"
            :key="order.id"
            :label="`${order.orderNo}（${order.statusText} ¥${Number(order.totalAmount).toFixed(2)}）`"
            :value="order.id"
          />
        </el-select>
      </div>

      <template v-if="currentOrder">
        <!-- 订单商品展示 -->
        <div class="order-items">
          <div v-for="item in currentOrder.items" :key="item.orderItemId" class="order-item">
            <img :src="item.productImage || '/default-product.svg'" class="thumb" alt="" @error="onImgError" />
            <div class="info">
              <p class="name">{{ item.productName }}</p>
              <span v-if="item.skuName" class="sku-tag">{{ item.skuName }}</span>
            </div>
            <span class="qty">× {{ item.quantity }}</span>
          </div>
        </div>

        <!-- 售后类型 -->
        <div class="form-row">
          <span class="label">售后类型：</span>
          <el-radio-group v-model="form.type">
            <el-radio :value="1">仅退款（无需寄回商品）</el-radio>
            <el-radio :value="2">退货退款（需寄回商品）</el-radio>
          </el-radio-group>
        </div>

        <!-- 退款金额（默认订单实付，可下调） -->
        <div class="form-row">
          <span class="label">退款金额：</span>
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :max="Number(currentOrder.totalAmount)"
            :precision="2"
            :step="1"
            style="width: 200px"
          />
          <span class="hint">订单实付 ¥{{ Number(currentOrder.totalAmount).toFixed(2) }}</span>
        </div>

        <!-- 申请原因 -->
        <div class="form-row">
          <span class="label">申请原因：</span>
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请描述售后原因，如：商品破损 / 尺码不合适 / 质量问题…"
            style="width: 480px"
          />
        </div>

        <div class="submit-row">
          <el-button type="danger" size="large" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
            提交申请
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrders } from '../api/order'
import { applyAfterSale } from '../api/afterSale'

const route = useRoute()
const router = useRouter()
const orders = ref([])
const loading = ref(false)
const submitting = ref(false)

/** 申请表单 */
const form = reactive({
  orderId: null,
  type: 1,
  reason: '',
  amount: 0
})

/** 当前选中订单 */
const currentOrder = computed(() => orders.value.find((o) => o.id === form.orderId) || null)

/** 可选订单：待发货(1)/待收货(2)/已完成(3)（待付款可取消、已取消不可售后） */
const availableOrders = computed(() =>
  orders.value.filter((o) => [1, 2, 3].includes(o.status))
)

/** 是否可提交：已选订单 + 类型 + 原因 + 金额 */
const canSubmit = computed(
  () =>
    !!form.orderId &&
    !!form.type &&
    form.reason.trim().length >= 5 &&
    Number(form.amount) > 0 &&
    Number(form.amount) <= Number(currentOrder.value?.totalAmount || 0)
)

/** 加载我的订单（用于选择售后订单） */
async function loadOrders() {
  loading.value = true
  try {
    // 一次性拉 100 条，覆盖可选订单
    const res = await getOrders({ page: 1, pageSize: 100 })
    orders.value = res.data.list || []
    // 支持从订单详情页带 orderId 直接定位
    const preset = Number(route.query.orderId)
    if (preset && orders.value.some((o) => o.id === preset)) {
      form.orderId = preset
      onOrderChange()
    } else if (availableOrders.value.length > 0) {
      form.orderId = availableOrders.value[0].id
      onOrderChange()
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 切换订单：默认退款金额 = 订单实付 */
function onOrderChange() {
  if (currentOrder.value) {
    form.amount = Number(currentOrder.value.totalAmount)
  }
}

/** 提交申请 */
async function onSubmit() {
  submitting.value = true
  try {
    await applyAfterSale({
      orderId: form.orderId,
      type: form.type,
      reason: form.reason.trim(),
      amount: form.amount
    })
    ElMessage.success('售后申请提交成功，等待商家审核')
    router.push('/after-sales')
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

function onImgError(event) {
  event.target.src = '/default-product.svg'
}

onMounted(loadOrders)
</script>

<style scoped>
.apply-page {
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

.apply-card {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
  margin-bottom: 18px;
  padding-left: 10px;
  border-left: 4px solid var(--mall-primary);
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.form-row .label {
  flex: 0 0 76px;
  font-size: 13px;
  color: #999;
  line-height: 32px;
}

.hint {
  font-size: 12px;
  color: #999;
  line-height: 32px;
}

.order-items {
  background: #fafafa;
  border-radius: 4px;
  padding: 10px 16px;
  margin: 0 0 16px 86px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-tag {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 6px;
  background: #f5f5f5;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.qty {
  font-size: 13px;
  color: #666;
}

.submit-row {
  text-align: right;
  margin-top: 8px;
}
</style>

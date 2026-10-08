<template>
  <!-- 购物车页（参考淘宝网页端）：表头 + 逐行商品 + 底部结算栏 -->
  <div class="page-container cart-page">
    <!-- 标题 -->
    <div class="cart-title">
      <h2>我的购物车</h2>
      <span class="count">共 {{ cartStore.totalCount }} 件商品</span>
    </div>

    <template v-if="cartStore.items.length > 0">
      <!-- 表头 -->
      <div class="cart-header">
        <div class="col-check">
          <el-checkbox v-model="allChecked">全选</el-checkbox>
        </div>
        <div class="col-info">商品信息</div>
        <div class="col-price">单价</div>
        <div class="col-qty">数量</div>
        <div class="col-subtotal">小计</div>
        <div class="col-op">操作</div>
      </div>

      <!-- 购物车明细 -->
      <CartItem
        v-for="item in cartStore.items"
        :key="item.cartId"
        :item="item"
        :checked="selectedIds.has(item.cartId)"
        @toggle="toggleSelect(item.cartId)"
        @quantity="(val) => onQuantity(item, val)"
        @remove="onRemove(item)"
      />

      <!-- 底部结算栏 -->
      <div class="settle-bar">
        <div class="settle-left">
          <el-button link @click="removeSelected">删除选中</el-button>
          <el-button link @click="clearAll">清空购物车</el-button>
        </div>
        <div class="settle-right">
          <span class="selected-info">
            已选 <b>{{ selectedCount }}</b> 件
          </span>
          <span class="total-label">合计：</span>
          <span class="total-price">¥{{ selectedTotal.toFixed(2) }}</span>
          <button class="checkout-btn" :disabled="selectedCount === 0" @click="onCheckout">去结算</button>
        </div>
      </div>
    </template>

    <!-- 空购物车 -->
    <div v-else class="empty-box">
      <el-empty description="购物车还是空的，去挑点好物吧">
        <router-link to="/">
          <el-button type="primary">去逛逛</el-button>
        </router-link>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import CartItem from '../components/CartItem.vue'
import { useCartStore } from '../store/cart'

const router = useRouter()
const cartStore = useCartStore()

/** 勾选的购物车项 ID 集合（全选状态由本页管理，store 不关心勾选） */
const selectedIds = ref(new Set())

/** 是否全选 */
const allChecked = computed({
  get: () => cartStore.items.length > 0 && selectedIds.value.size === cartStore.items.length,
  set: (checked) => {
    if (checked) {
      selectedIds.value = new Set(cartStore.items.map((it) => it.cartId))
    } else {
      selectedIds.value = new Set()
    }
  }
})

/** 选中件数（数量求和） */
const selectedCount = computed(() =>
  cartStore.items
    .filter((it) => selectedIds.value.has(it.cartId))
    .reduce((sum, it) => sum + it.quantity, 0)
)

/** 选中金额合计 */
const selectedTotal = computed(() =>
  cartStore.items
    .filter((it) => selectedIds.value.has(it.cartId))
    .reduce((sum, it) => sum + Number(it.price || 0) * it.quantity, 0)
)

/** 勾选/取消勾选单项 */
function toggleSelect(cartId) {
  const next = new Set(selectedIds.value)
  if (next.has(cartId)) {
    next.delete(cartId)
  } else {
    next.add(cartId)
  }
  selectedIds.value = next
}

/** 数量变化 */
async function onQuantity(item, val) {
  if (!val || val === item.quantity) return
  await cartStore.updateQuantity(item.cartId, val)
}

/** 删除单项（带确认） */
async function onRemove(item) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.productName}」吗？`, '删除确认', {
      type: 'warning'
    })
  } catch (e) {
    return // 用户取消
  }
  await cartStore.removeItem(item.cartId)
  selectedIds.value.delete(item.cartId)
  ElMessage.success('已删除')
}

/** 删除选中 */
async function removeSelected() {
  if (selectedIds.value.size === 0) return
  const ids = [...selectedIds.value]
  for (const id of ids) {
    await cartStore.removeItem(id)
  }
  selectedIds.value = new Set()
  ElMessage.success('已删除选中商品')
}

/** 清空购物车 */
async function clearAll() {
  try {
    await ElMessageBox.confirm('确定清空购物车吗？', '清空确认', { type: 'warning' })
  } catch (e) {
    return
  }
  await cartStore.clearCart()
  selectedIds.value = new Set()
  ElMessage.success('购物车已清空')
}

/** 去结算：跳转确认订单页，携带勾选的购物车项 ID */
function onCheckout() {
  if (selectedIds.value.size === 0) return
  const ids = [...selectedIds.value].join(',')
  router.push({ path: '/order/create', query: { cartIds: ids } })
}

// 进入页面时确保购物车已加载（登录态下从后端拉取）
onMounted(() => {
  cartStore.init()
})
</script>

<style scoped>
.cart-page {
  min-height: 70vh;
  padding-top: 20px;
}

.cart-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.cart-title h2 {
  font-size: 20px;
  color: #333;
}

.cart-title .count {
  font-size: 13px;
  color: #999;
}

/* ---------- 表头（与单行列等宽对齐） ---------- */
.cart-header {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #888;
}

.col-check {
  flex: 0 0 60px;
  display: flex;
  justify-content: center;
}

.col-info {
  flex: 1;
}

.col-price,
.col-subtotal {
  flex: 0 0 110px;
  text-align: center;
}

.col-qty {
  flex: 0 0 130px;
  text-align: center;
}

.col-op {
  flex: 0 0 70px;
  text-align: center;
}

/* ---------- 底部结算栏 ---------- */
.settle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 4px;
  padding: 14px 16px;
  margin-top: 12px;
}

.settle-right {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.selected-info {
  font-size: 14px;
  color: #666;
}

.selected-info b {
  color: var(--mall-price);
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--mall-price);
}

.checkout-btn {
  height: 38px;
  padding: 0 32px;
  border: none;
  border-radius: 4px;
  background: var(--mall-price);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

.checkout-btn:hover {
  background: #e0430d;
}

.checkout-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.empty-box {
  background: #fff;
  border-radius: 6px;
  padding: 40px 0;
}
</style>

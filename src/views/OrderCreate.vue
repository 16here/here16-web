<template>
  <!-- 确认订单页（参考淘宝结算页）：商品清单 + 收货地址 + 备注 + 金额明细 -->
  <div v-loading="loading" class="page-container create-page">
    <div class="page-head">
      <h2>确认订单</h2>
    </div>

    <!-- 收货地址 -->
    <div class="block">
      <div class="block-title">收货地址</div>
      <div v-if="addresses.length > 0" class="addr-row">
        <label
          v-for="addr in addresses"
          :key="addr.id"
          class="addr-item"
          :class="{ active: selectedAddressId === addr.id }"
          @click="selectedAddressId = addr.id"
        >
          <input type="radio" :checked="selectedAddressId === addr.id" class="radio-hidden" />
          <div>
            <div class="addr-name">
              {{ addr.receiverName }} <span>{{ addr.receiverPhone }}</span>
              <el-tag v-if="addr.isDefault === 1" type="danger" size="small">默认</el-tag>
            </div>
            <p class="addr-full">{{ addr.fullAddress }}</p>
          </div>
        </label>
      </div>
      <div v-else class="no-addr">
        <p>还没有收货地址</p>
        <router-link to="/address"><el-button type="primary" size="small">去新增地址</el-button></router-link>
      </div>
    </div>

    <!-- 商品清单 -->
    <div class="block">
      <div class="block-title">商品清单</div>
      <div class="items">
        <div v-for="item in selectedItems" :key="item.cartId" class="item-row">
          <router-link :to="`/product/${item.productId}`" class="thumb">
            <img :src="item.productImage || '/default-product.svg'" :alt="item.productName" @error="onImgError" />
          </router-link>
          <div class="info">
            <router-link :to="`/product/${item.productId}`" class="name">{{ item.productName }}</router-link>
            <span v-if="item.skuName" class="sku-tag">{{ item.skuName }}</span>
          </div>
          <div class="right">
            <span class="price">¥{{ Number(item.price || 0).toFixed(2) }}</span>
            <span class="qty">× {{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 优惠券（阶段 8）：可用券列表 + 试算优惠金额 -->
    <div class="block">
      <div class="block-title">优惠券</div>
      <div v-if="availableCoupons.length > 0" class="coupon-row">
        <label
          v-for="c in availableCoupons"
          :key="c.id"
          class="coupon-item"
          :class="{ active: selectedCouponId === c.id }"
          @click.stop.prevent="onSelectCoupon(c)"
        >
          <input type="radio" :checked="selectedCouponId === c.id" class="radio-hidden" />
          <div class="coupon-left">
            <template v-if="c.type === 1">
              <b>¥{{ Number(c.amount || 0).toFixed(0) }}</b>
              <span>满 {{ Number(c.threshold || 0).toFixed(0) }} 可用</span>
            </template>
            <template v-else>
              <b>{{ (Number(c.discountRate) * 10).toFixed(1).replace('.0', '') }}折</b>
              <span>无门槛</span>
            </template>
          </div>
          <div class="coupon-right">
            <p class="coupon-name">{{ c.couponName }}</p>
            <p class="coupon-expire">有效期至 {{ String(c.expireAt).slice(0, 10) }}</p>
          </div>
        </label>
      </div>
      <div v-else class="no-coupon">
        <span>暂无可用优惠券</span>
        <router-link to="/coupons" class="go-center">去领券中心 ›</router-link>
      </div>
      <div class="coupon-tip">
        已选用券优惠 ¥{{ couponAmount.toFixed(2) }}（最终优惠金额以下单结果为准）
      </div>
    </div>

    <!-- 备注 -->
    <div class="block">
      <div class="block-title">订单备注</div>
      <el-input
        v-model="remark"
        type="textarea"
        :rows="2"
        maxlength="200"
        show-word-limit
        placeholder="选填，可给商家留言（200 字以内）"
      />
    </div>

    <!-- 金额明细 + 提交 -->
    <div class="settle-bar">
      <div class="amount">
        <div class="amount-row">
          <span>商品金额</span>
          <span>¥{{ goodsTotal.toFixed(2) }}</span>
        </div>
        <div class="amount-row">
          <span>运费</span>
          <span>¥0.00</span>
        </div>
        <div v-if="couponAmount > 0" class="amount-row">
          <span>券优惠</span>
          <span class="discount">-¥{{ couponAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-row total">
          <span>应付合计</span>
          <span>¥{{ payableTotal.toFixed(2) }}</span>
        </div>
      </div>
      <div class="actions">
        <span class="tip">共 {{ totalCount }} 件</span>
        <el-button type="danger" size="large" :disabled="!canSubmit" :loading="submitting" @click="onSubmit">
          提交订单
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAddresses } from '../api/address'
import { createOrder } from '../api/order'
import { getAvailableCoupons, previewCoupon } from '../api/coupon'
import { useCartStore } from '../store/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const submitting = ref(false)
const addresses = ref([])
const selectedAddressId = ref(null)
const remark = ref('')

// ---------- 优惠券（阶段 8） ----------
const availableCoupons = ref([])
const selectedCouponId = ref(null)
const couponAmount = ref(0)

/** 勾选的购物车项 ID（路由 query 传入，逗号分隔） */
const cartIds = computed(() =>
  (route.query.cartIds || '').split(',').map((s) => Number(s)).filter((n) => n > 0)
)

/** 从购物车中取出本次结算的商品 */
const selectedItems = computed(() =>
  cartStore.items.filter((it) => cartIds.value.includes(it.cartId))
)

/** 结算件数 */
const totalCount = computed(() => selectedItems.value.reduce((s, it) => s + it.quantity, 0))

/** 商品金额合计（价格以购物车数据为准，与后端一致） */
const goodsTotal = computed(() =>
  selectedItems.value.reduce((s, it) => s + Number(it.price || 0) * it.quantity, 0)
)

/** 应付合计（前端预估值：商品金额 - 券优惠；活动优惠由后端在下单时计算） */
const payableTotal = computed(() => Math.max(goodsTotal.value - couponAmount.value, 0))

/** 可提交：有地址 + 有商品 */
const canSubmit = computed(() => selectedAddressId.value != null && selectedItems.value.length > 0)

/** 加载地址列表，默认选中默认地址 */
async function loadAddresses() {
  try {
    const res = await getAddresses()
    addresses.value = res.data || []
    const def = addresses.value.find((a) => a.isDefault === 1)
    selectedAddressId.value = def ? def.id : addresses.value[0]?.id ?? null
  } catch (e) {
    // 拦截器已提示
  }
}

/** 加载可用券（按商品金额筛选门槛；金额为 0 时跳过） */
async function loadCoupons() {
  if (goodsTotal.value <= 0) return
  try {
    const res = await getAvailableCoupons(goodsTotal.value)
    availableCoupons.value = res.data || []
  } catch (e) {
    // 拦截器已提示（如未登录）
  }
}

/** 选择 / 取消一张券，并试算优惠金额 */
async function onSelectCoupon(c) {
  // 再点一次已选中的券 = 取消使用
  if (selectedCouponId.value === c.id) {
    selectedCouponId.value = null
    couponAmount.value = 0
    return
  }
  selectedCouponId.value = c.id
  try {
    const res = await previewCoupon(c.id, goodsTotal.value)
    couponAmount.value = Number(res.data || 0)
  } catch (e) {
    // 试算失败（如券状态变化）：取消选中并复位
    selectedCouponId.value = null
    couponAmount.value = 0
  }
}

/** 提交订单 */
async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  const payload = {
    addressId: selectedAddressId.value,
    cartIds: cartIds.value,
    remark: remark.value.trim() || null,
    userCouponId: selectedCouponId.value || null
  }
  try {
    const res = await createOrder(payload)
    // 下单成功后后端已清掉购物车中对应项，刷新本地购物车与角标
    await cartStore.fetchCart()
    ElMessage.success('下单成功')
    router.push(`/order/${res.data.id}`)
  } catch (e) {
    // 拦截器已提示（如库存不足）
  } finally {
    submitting.value = false
  }
}

/** 图片加载失败兜底 */
function onImgError(event) {
  event.target.src = '/default-product.svg'
}

onMounted(async () => {
  if (cartIds.value.length === 0) {
    ElMessage.warning('请先在购物车选择要结算的商品')
    router.replace('/cart')
    return
  }
  loading.value = true
  try {
    // 确保购物车已加载（已登录从后端拉取）
    await cartStore.init()
    await loadAddresses()
    await loadCoupons()
    if (selectedItems.value.length === 0) {
      ElMessage.warning('结算商品已失效，请重新选择')
      router.replace('/cart')
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.create-page {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
  margin-bottom: 14px;
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
  margin-bottom: 14px;
  padding-left: 8px;
  border-left: 4px solid var(--mall-primary);
}

/* 地址选择 */
.addr-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.addr-item {
  flex: 0 0 calc(33% - 8px);
  min-width: 240px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.addr-item:hover {
  border-color: var(--mall-primary);
}

.addr-item.active {
  border-color: var(--mall-primary);
  background: var(--mall-primary-light);
}

.radio-hidden {
  display: none;
}

.addr-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.addr-name span {
  color: #666;
  margin-left: 8px;
  font-weight: 400;
}

.addr-full {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.no-addr {
  text-align: center;
  padding: 12px 0;
  color: #999;
}

.no-addr p {
  margin-bottom: 10px;
}

/* ---------- 优惠券选择（阶段 8） ---------- */
.coupon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.coupon-item {
  display: flex;
  align-items: stretch;
  width: 100%;
  max-width: 420px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
}

.coupon-item:hover {
  border-color: var(--mall-primary);
}

.coupon-item.active {
  border: 2px solid var(--mall-primary);
  background: var(--mall-primary-light);
}

.coupon-left {
  flex: 0 0 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(135deg, #ff5000 0%, #ff7a3d 100%);
  color: #fff;
  padding: 8px;
}

.coupon-left b {
  font-size: 20px;
  line-height: 1;
}

.coupon-left span {
  font-size: 11px;
  opacity: 0.92;
}

.coupon-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  gap: 4px;
}

.coupon-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-expire {
  font-size: 12px;
  color: #999;
}

.no-coupon {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  color: #999;
  font-size: 13px;
}

.go-center {
  color: var(--mall-primary);
  font-size: 13px;
}

.coupon-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

.discount {
  color: var(--mall-primary);
}

/* 商品清单 */
.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.thumb {
  flex: 0 0 64px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}

.name:hover {
  color: var(--mall-primary);
}

.sku-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.right {
  text-align: right;
}

.price {
  color: var(--mall-price);
  font-size: 15px;
  font-weight: 600;
}

.qty {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

/* 结算栏 */
.settle-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: #fff;
  border-radius: 6px;
  padding: 18px;
}

.amount {
  width: 320px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  padding: 4px 0;
}

.amount-row.total {
  font-size: 16px;
  font-weight: 700;
  color: var(--mall-price);
  border-top: 1px dashed #eee;
  padding-top: 10px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tip {
  font-size: 13px;
  color: #999;
}

.actions :deep(.el-button--large) {
  padding: 0 40px;
  height: 44px;
  background: var(--mall-price);
  border-color: var(--mall-price);
}
</style>

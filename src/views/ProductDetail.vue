<template>
  <!-- 商品详情页（参考淘宝网页端）：
       左：商品图轮播；右：名称/价格/库存/分类、规格选择、数量、加入购物车；
       下方：商品描述。 -->
  <div v-loading="loading" class="page-container detail-page">
    <template v-if="product">
      <!-- 面包屑 -->
      <div class="crumb">
        <router-link to="/">首页</router-link>
        <span class="sep">/</span>
        <router-link :to="`/category/${product.categoryId}`" class="cat-link">
          {{ product.categoryName }}
        </router-link>
      </div>

      <div class="detail-main">
        <!-- 左：商品图轮播 -->
        <div class="gallery">
          <el-carousel height="400px" :interval="0" arrow="always">
            <el-carousel-item v-for="(img, index) in displayImages" :key="index">
              <img :src="img" :alt="product.name" @error="onImgError" />
            </el-carousel-item>
          </el-carousel>
        </div>

        <!-- 右：商品信息与购买操作 -->
        <div class="info">
          <h1 class="title">{{ product.name }}</h1>
          <div class="price-box">
            <span class="label">价格</span>
            <span class="price">¥ {{ currentPrice.toFixed(2) }}</span>
          </div>

          <!-- 库存与销量信息 -->
          <div class="meta">
            <span>库存：<b :class="{ 'stock-low': currentStock < 10 }">{{ currentStock }}</b></span>
            <span>分类：{{ product.categoryName }}</span>
            <span>SKU：{{ product.sku }}</span>
          </div>

          <!-- 规格选择（内联单选，联动价格与库存） -->
          <div v-if="product.skus && product.skus.length > 0" class="sku-row">
            <span class="sku-label">规格：</span>
            <button
              v-for="sku in product.skus"
              :key="sku.id"
              type="button"
              class="sku-btn"
              :class="{ active: selectedSku?.id === sku.id, disabled: sku.stock <= 0 }"
              :disabled="sku.stock <= 0"
              @click="selectedSku = sku"
            >
              {{ sku.name }}
              <small v-if="sku.stock <= 0">（无货）</small>
            </button>
          </div>

          <!-- 数量 -->
          <div class="qty-row">
            <span class="label">数量：</span>
            <el-input-number v-model="quantity" :min="1" :max="currentStock" :disabled="currentStock <= 0" />
          </div>

          <!-- 操作区 -->
          <div class="actions">
            <!-- 收藏按钮（阶段 11 需求 3）：心形，需登录；收藏状态实时显示 -->
            <el-button
              size="large"
              class="fav-detail-btn"
              :class="{ 'fav-active': favState === 'favorited' }"
              @click="onToggleFavorite"
            >
              <el-icon :size="16">
                <StarFilled v-if="favState === 'favorited'" />
                <Star v-else />
              </el-icon>
              {{ favState === 'favorited' ? '已收藏' : '收藏' }}
            </el-button>
            <el-button type="danger" size="large" class="cart-btn" :disabled="currentStock <= 0" @click="openSkuSelector">
              加入购物车
            </el-button>
            <el-button size="large" class="buy-btn" :disabled="currentStock <= 0" @click="onBuyNow">
              立即购买
            </el-button>
          </div>
        </div>
      </div>

      <!-- 商品描述 -->
      <div class="desc">
        <h3 class="floor-title">商品详情</h3>
        <p class="desc-text">{{ product.description || '暂无描述' }}</p>
      </div>

      <!-- 商品评价（阶段 7：评分概览 + 已发布评价列表，数据来自 /api/reviews） -->
      <ProductReviews :product-id="product.id" />

      <!-- 相关推荐（阶段 10：看过此商品的用户还看了，物品协同过滤） -->
      <RecommendList
        :title="related.title || '相关推荐'"
        :reason="related.reason"
        :products="related.products"
        :loading="relatedLoading"
        :show-empty="false"
      />
    </template>

    <el-empty v-else-if="!loading" description="商品不存在或已下架" />

    <!-- 规格选择弹窗（加入购物车时确认规格与数量） -->
    <SkuSelector
      v-model="skuDialogVisible"
      :skus="product?.skus || []"
      :default-sku-id="selectedSku?.id"
      @confirm="onCartConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProductDetail, getSkuStock, getProductStock } from '../api/product'
import { getProductRecommend } from '../api/recommend'
import { addFavorite, removeFavorite, getFavoriteStatus } from '../api/favorite'
import SkuSelector from '../components/SkuSelector.vue'
import ProductReviews from '../components/ProductReviews.vue'
import RecommendList from '../components/RecommendList.vue'
import { useUserStore } from '../store/user'
import { useCartStore } from '../store/cart'
import { Star, StarFilled } from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const product = ref(null)
const loading = ref(false)

/** 相关推荐数据（看过此商品的用户还看了） */
const related = ref({ title: '', reason: '', products: [] })
const relatedLoading = ref(false)

/** 已选规格（默认第一个有货规格） */
const selectedSku = ref(null)
/** 购买数量 */
const quantity = ref(1)
/** 规格选择弹窗显隐 */
const skuDialogVisible = ref(false)

/** 收藏状态（阶段 11 需求 3）：'idle' 未收藏 / 'favorited' 已收藏 / 'loading' 查询中 */
const favState = ref('idle')

/** 展示图片：优先商品图，无图时兜底 */
const displayImages = computed(() => {
  const images = product.value?.images || []
  return images.length > 0 ? images : ['/default-product.svg']
})

/** 当前价格：选中规格用规格价，否则用商品价 */
const currentPrice = computed(() => selectedSku.value?.price ?? product.value?.price ?? 0)

/** 当前库存：选中规格用规格库存，否则用商品库存 */
const currentStock = computed(() => selectedSku.value?.stock ?? product.value?.stock ?? 0)

/** 加载详情 */
async function loadDetail(id) {
  loading.value = true
  try {
    const res = await getProductDetail(id)
    product.value = res.data
    // 默认选中第一个有货规格
    selectedSku.value = (res.data.skus || []).find((s) => s.stock > 0) || null
    quantity.value = 1
    // 阶段 6：拉取 Redis 实时可卖库存，覆盖详情接口的库存快照
    refreshLiveStock()
    // 阶段 10：加载相关推荐（协同过滤，无相似数据时后端自动兜底同分类）
    loadRelated(id)
    // 阶段 11：查询当前用户对该商品的收藏状态（未登录不查，按钮默认未收藏）
    loadFavoriteStatus(id)
  } catch (error) {
    ElMessage.error('商品详情加载失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}

/** 加载相关推荐（看过此商品的用户还看了） */
async function loadRelated(id) {
  relatedLoading.value = true
  try {
    const res = await getProductRecommend(id)
    related.value = res.data || { title: '', reason: '', products: [] }
  } catch {
    // 推荐接口失败不影响商品详情展示（推荐位留空即可）
  } finally {
    relatedLoading.value = false
  }
}

/**
 * 查询当前用户对商品的收藏状态（阶段 11 需求 3）。
 * 未登录不发请求（按钮保持"收藏"态，点击时引导登录）。
 */
async function loadFavoriteStatus(id) {
  if (!userStore.isLogin) {
    favState.value = 'idle'
    return
  }
  try {
    const res = await getFavoriteStatus(id)
    favState.value = res.data ? 'favorited' : 'idle'
  } catch {
    favState.value = 'idle' // 查询失败按未收藏处理，不影响浏览
  }
}

/** 点击收藏/取消收藏（幂等） */
async function onToggleFavorite() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    window.location.href = '/login'
    return
  }
  try {
    if (favState.value === 'favorited') {
      await removeFavorite(route.params.id)
      favState.value = 'idle'
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite(route.params.id)
      favState.value = 'favorited'
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    ElMessage.error('操作失败，请稍后再试')
  }
}

/**
 * 刷新实时库存（阶段 6）：
 * - 有规格：调 /api/skus/{id}/stock 更新该规格可卖库存；
 * - 无规格：调 /api/products/{id}/stock 更新商品级可卖库存。
 * 库存不足时规格按钮与"加入购物车"自动禁用（模板中已按 stock 判断）。
 */
async function refreshLiveStock() {
  try {
    if (selectedSku.value) {
      const res = await getSkuStock(selectedSku.value.id)
      selectedSku.value.stock = res.data
    } else if (product.value) {
      const res = await getProductStock(product.value.id)
      product.value.stock = res.data
    }
  } catch {
    // 实时库存刷新失败时沿用详情接口返回的库存（不影响页面使用）
  }
}

/**
 * 加入购物车：
 * - 有规格的商品：打开规格选择弹窗确认后调用；
 * - 无规格的商品：直接用商品默认信息加购（skuId=0，后端按无规格处理）。
 */
function openSkuSelector() {
  if (product.value.skus && product.value.skus.length > 0) {
    skuDialogVisible.value = true
  } else {
    onCartConfirm({ sku: null, quantity: quantity.value })
  }
}

/**
 * 弹窗确认/无规格加购：写入购物车。
 * 已登录走后端接口（同一商品+规格自动合并数量）；未登录写入本地购物车，登录后自动合并。
 */
async function onCartConfirm({ sku, quantity: qty }) {
  const payload = {
    productId: product.value.id,
    skuId: sku?.id || 0,
    quantity: qty,
    productName: product.value.name,
    productImage: displayImages.value[0] || '',
    price: sku?.price ?? product.value.price,
    skuName: sku?.name || '',
    stock: sku?.stock ?? product.value.stock
  }
  try {
    await cartStore.addItem(payload)
    const msg = userStore.isLogin ? '已加入购物车' : '已加入本地购物车，登录后自动同步'
    ElMessage.success(msg)
  } catch (e) {
    // 错误提示已由 request 拦截器统一弹出
  }
}

/** 立即购买：演示提示，下单功能属订单模块 */
function onBuyNow() {
  ElMessage.info('下单功能将在订单模块上线后开放')
}

/** 图片加载失败兜底 */
function onImgError(event) {
  event.target.src = '/default-product.svg'
}

onMounted(() => {
  loadDetail(route.params.id)
})

// 路由切换（同页面不同商品）时重新加载
watch(
  () => route.params.id,
  (id) => id && loadDetail(id)
)
</script>

<style scoped>
.detail-page {
  min-height: 70vh;
}

/* ---------- 面包屑 ---------- */
.crumb {
  padding: 14px 0;
  font-size: 13px;
  color: #666;
}

.crumb a {
  color: var(--mall-primary);
  text-decoration: none;
}

.sep {
  margin: 0 6px;
  color: #ccc;
}

/* ---------- 主体 ---------- */
.detail-main {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: 6px;
  padding: 24px;
}

/* 左：图册 */
.gallery {
  flex: 0 0 420px;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
}

.gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 右：信息 */
.info {
  flex: 1;
}

.title {
  font-size: 22px;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.4;
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 10px;
  background: var(--mall-price-bg);
  border-radius: 4px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.price-box .label {
  font-size: 13px;
  color: #999;
}

.price {
  font-size: 30px;
  font-weight: 700;
  color: var(--mall-price);
}

.meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.meta b {
  color: #333;
}

.stock-low {
  color: var(--mall-price);
}

/* 规格选择 */
.sku-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.sku-label,
.qty-row .label {
  font-size: 13px;
  color: #999;
}

.sku-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;
}

.sku-btn:hover {
  border-color: var(--mall-primary);
  color: var(--mall-primary);
}

.sku-btn.active {
  border-color: var(--mall-primary);
  background: var(--mall-primary-light);
  color: var(--mall-primary);
}

.sku-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
  background: #fafafa;
}

/* 数量 */
.qty-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

/* 操作区 */
.actions {
  display: flex;
  gap: 12px;
}

/* 收藏按钮（阶段 11 需求 3）：白底橙字心形，收藏后橙底白字 */
.fav-detail-btn {
  background: #fff;
  border: 1px solid var(--mall-primary);
  color: var(--mall-primary);
  width: 110px;
}

.fav-detail-btn:hover {
  background: var(--mall-primary-light);
  color: var(--mall-primary);
}

.fav-detail-btn.fav-active {
  background: var(--mall-primary);
  border-color: var(--mall-primary);
  color: #fff;
}

.fav-detail-btn.fav-active:hover {
  background: var(--mall-primary-dark);
  color: #fff;
}

.cart-btn {
  background: var(--mall-price);
  border-color: var(--mall-price);
  width: 160px;
}

.cart-btn:hover {
  background: #e0430d;
  border-color: #e0430d;
}

.buy-btn {
  color: #fff;
  background: var(--mall-primary);
  border-color: var(--mall-primary);
  width: 160px;
}

.buy-btn:hover {
  background: var(--mall-primary-dark);
  border-color: var(--mall-primary-dark);
}

/* ---------- 商品描述 ---------- */
.desc {
  margin-top: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.floor-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 4px solid var(--mall-primary);
}

.desc-text {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>

<template>
  <!-- 商品评价列表页（阶段 7）：独立浏览某个商品的评价（评分概览 + 列表） -->
  <div class="page-container review-list-page">
    <div class="crumb">
      <router-link to="/">首页</router-link>
      <span class="sep">/</span>
      <span>商品评价</span>
    </div>

    <div v-loading="productLoading" class="head-box" v-if="product">
      <router-link :to="`/product/${product.id}`" class="thumb">
        <img :src="(product.images && product.images[0]) || '/default-product.svg'" alt="" @error="onImgError" />
      </router-link>
      <div class="info">
        <router-link :to="`/product/${product.id}`" class="name">{{ product.name }}</router-link>
        <p class="price">¥{{ currentPrice.toFixed(2) }}</p>
      </div>
      <router-link :to="`/product/${product.id}`">
        <el-button size="small" type="primary" plain>返回商品详情</el-button>
      </router-link>
    </div>

    <ProductReviews :product-id="route.params.productId" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProductDetail } from '../api/product'
import ProductReviews from '../components/ProductReviews.vue'

const route = useRoute()
const product = ref(null)
const productLoading = ref(false)

/** 当前展示价格（默认第一个有货规格价，否则商品价） */
const currentPrice = computed(() => {
  const skus = product.value?.skus || []
  const first = skus.find((s) => s.stock > 0) || skus[0]
  return Number(first?.price ?? product.value?.price ?? 0)
})

/** 加载商品摘要（头部展示名称/图/价） */
async function loadProduct(id) {
  productLoading.value = true
  try {
    const res = await getProductDetail(id)
    product.value = res.data
  } catch (e) {
    // 拦截器已提示
  } finally {
    productLoading.value = false
  }
}

function onImgError(event) {
  event.target.src = '/default-product.svg'
}

onMounted(() => {
  loadProduct(route.params.productId)
})
</script>

<style scoped>
.review-list-page {
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

.head-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 4px;
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
  font-size: 15px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name:hover {
  color: var(--mall-primary);
}

.price {
  margin-top: 4px;
  color: var(--mall-price);
  font-size: 16px;
  font-weight: 700;
}
</style>

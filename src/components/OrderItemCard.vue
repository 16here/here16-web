<template>
  <!-- 订单商品行（订单列表卡片 / 订单详情共用）：图 + 名称/规格 + 单价×数量 + 小计 -->
  <div class="order-item">
    <router-link :to="`/product/${item.productId}`" class="thumb">
      <img :src="item.productImage || '/default-product.svg'" :alt="item.productName" @error="onImgError" />
    </router-link>
    <div class="info">
      <router-link :to="`/product/${item.productId}`" class="name">{{ item.productName }}</router-link>
      <span v-if="item.skuName" class="sku-tag">{{ item.skuName }}</span>
    </div>
    <div class="price">¥{{ Number(item.price || 0).toFixed(2) }}</div>
    <div class="qty">× {{ item.quantity }}</div>
    <div class="subtotal">¥{{ Number(item.subtotal ?? item.price * item.quantity).toFixed(2) }}</div>
  </div>
</template>

<script setup>
/**
 * 订单商品行组件。
 * @prop item 订单明细（productId/productName/productImage/skuName/price/quantity/subtotal）
 */
defineProps({
  item: { type: Object, required: true }
})

/** 图片加载失败兜底 */
function onImgError(event) {
  event.target.src = '/default-product.svg'
}
</script>

<style scoped>
.order-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 12px;
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
  line-height: 1.4;
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

.price,
.qty {
  flex: 0 0 90px;
  text-align: center;
  font-size: 13px;
  color: #666;
}

.subtotal {
  flex: 0 0 100px;
  text-align: right;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}
</style>

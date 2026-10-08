<template>
  <!-- 购物车单行（参考淘宝网页端）：
       勾选 + 商品信息（图/名/规格）+ 单价 + 数量 + 小计 + 删除 -->
  <div class="cart-item">
    <!-- 勾选 -->
    <div class="col-check">
      <el-checkbox :model-value="checked" @change="emit('toggle')" />
    </div>

    <!-- 商品信息 -->
    <div class="col-info">
      <router-link :to="`/product/${item.productId}`" class="thumb">
        <img :src="item.productImage || '/default-product.svg'" :alt="item.productName" @error="onImgError" />
      </router-link>
      <div class="info-text">
        <router-link :to="`/product/${item.productId}`" class="name">{{ item.productName }}</router-link>
        <span v-if="item.skuName" class="sku-tag">{{ item.skuName }}</span>
        <!-- 阶段 6：实时库存低于购买数量时给出提示（可卖库存为 stock - locked_stock） -->
        <span v-if="Number(item.stock) < item.quantity" class="stock-warn">
          ⚠ 库存紧张，仅剩 {{ item.stock }} 件
        </span>
      </div>
    </div>

    <!-- 单价 -->
    <div class="col-price">¥{{ Number(item.price || 0).toFixed(2) }}</div>

    <!-- 数量 -->
    <div class="col-qty">
      <el-input-number
        :model-value="item.quantity"
        :min="1"
        :max="Math.max(item.stock || 1, 1)"
        size="small"
        @change="(val) => emit('quantity', val)"
      />
    </div>

    <!-- 小计 -->
    <div class="col-subtotal">¥{{ (Number(item.price || 0) * item.quantity).toFixed(2) }}</div>

    <!-- 操作 -->
    <div class="col-op">
      <el-button link type="danger" @click="emit('remove')">删除</el-button>
    </div>
  </div>
</template>

<script setup>
/**
 * 购物车单项组件。
 *
 * 事件：
 * - toggle：切换勾选；
 * - quantity(val)：数量变化（含 +/- 与手动输入）；
 * - remove：删除该项。
 * 具体操作（后端接口 / 本地购物车）由父组件交给 cart store 处理，本组件只负责展示与上报。
 */
defineProps({
  /** 购物车项（CartItemVO 或本地项，含 cartId/productId/skuId/quantity/productName/productImage/skuName/price/stock） */
  item: { type: Object, required: true },
  /** 是否被勾选 */
  checked: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle', 'quantity', 'remove'])

/** 图片加载失败兜底 */
function onImgError(event) {
  event.target.src = '/default-product.svg'
}
</script>

<style scoped>
.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 8px;
}

/* 六列等宽布局：勾选 / 信息 / 单价 / 数量 / 小计 / 操作 */
.col-check {
  flex: 0 0 60px;
  display: flex;
  justify-content: center;
}

.col-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.thumb {
  flex: 0 0 72px;
  height: 72px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-text {
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
  margin-top: 6px;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

/* 阶段 6：库存不足提示（橙色警示，仿淘宝"仅剩 X 件"文案） */
.stock-warn {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--mall-price);
}

.col-price,
.col-subtotal {
  flex: 0 0 110px;
  text-align: center;
  font-size: 14px;
  color: #333;
}

.col-qty {
  flex: 0 0 130px;
  display: flex;
  justify-content: center;
}

.col-op {
  flex: 0 0 70px;
  text-align: center;
}
</style>

<template>
  <!-- 推荐楼层（阶段 10）：标题 + 推荐理由 + 商品网格。
       首页"热门推荐/猜你喜欢"、商品详情"相关推荐"共用的展示组件。 -->
  <div v-if="products.length > 0 || showEmpty" class="floor">
    <div class="floor-head">
      <h3 class="floor-title">{{ title }}</h3>
      <span v-if="reason" class="floor-reason">{{ reason }}</span>
    </div>
    <div v-loading="loading" class="goods-grid">
      <ProductCard v-for="item in products" :key="item.id" :product="item" />
      <el-empty
        v-if="!loading && products.length === 0"
        description="暂无推荐商品，多逛逛积累行为数据吧"
        :image-size="80"
      />
    </div>
  </div>
</template>

<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  /** 楼层标题（如：热门推荐 / 猜你喜欢 / 相关推荐） */
  title: { type: String, required: true },
  /** 推荐理由说明（如：根据全站近 7 天的浏览与购买热度推荐） */
  reason: { type: String, default: '' },
  /** 商品列表（ProductListVO[]） */
  products: { type: Array, default: () => [] },
  /** 加载中状态（展示 loading 遮罩） */
  loading: { type: Boolean, default: false },
  /** 空数据时也渲染楼层（展示空态文案） */
  showEmpty: { type: Boolean, default: true }
})
</script>

<style scoped>
.floor {
  margin-top: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.floor-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.floor-title {
  font-size: 18px;
  font-weight: 700;
  padding-left: 10px;
  border-left: 4px solid var(--mall-primary);
}

.floor-reason {
  font-size: 12px;
  color: #999;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  min-height: 220px;
}
</style>

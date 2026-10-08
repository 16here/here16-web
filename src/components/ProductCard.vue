<template>
  <!-- 商品卡片：图片 + 名称 + 价格 + 收藏按钮，点击进入详情（收藏按钮独立拦截点击） -->
  <div class="product-card" @click="$router.push(`/product/${product.id}`)">
    <!-- 主图：加载失败时显示占位色块（商品图可能为外部占位图） -->
    <div class="card-img">
      <img
        v-if="product.cover"
        :src="product.cover"
        :alt="product.name"
        loading="lazy"
        @error="onImgError"
      />
      <div v-else class="img-placeholder">暂无图片</div>
      <!-- 收藏按钮：心形，点击收藏/取消收藏（需登录，未登录弹提示并跳登录） -->
      <button
        class="fav-btn"
        :class="{ active: favState === 'favorited' }"
        :title="favState === 'favorited' ? '取消收藏' : '收藏'"
        @click.stop.prevent="onToggleFavorite"
      >
        <el-icon :size="16"><StarFilled v-if="favState === 'favorited'" /><Star v-else /></el-icon>
      </button>
    </div>
    <div class="card-info">
      <p class="card-name" :title="product.name">{{ product.name }}</p>
      <div class="card-bottom">
        <span class="price">{{ product.price.toFixed(2) }}</span>
        <span class="stock" :class="{ 'stock-low': product.stock < 10 }">
          {{ product.status === 1 ? `库存 ${product.stock}` : '已下架' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { addFavorite, removeFavorite, getFavoriteStatus } from '../api/favorite'
import { useUserStore } from '../store/user'

const props = defineProps({
  /** 商品列表项（ProductListVO） */
  product: { type: Object, required: true }
})

const userStore = useUserStore()

/** 收藏状态：'idle' 未收藏 / 'favorited' 已收藏 / 'loading' 查询中 */
const favState = ref('idle')

/**
 * 挂载时查询该商品是否已被当前用户收藏（仅登录时查询）。
 * 未登录保持 idle（点击时引导登录），避免未登录也发请求。
 */
onMounted(() => {
  if (userStore.isLogin) {
    favState.value = 'loading'
    getFavoriteStatus(props.product.id)
      .then(res => {
        favState.value = res.data ? 'favorited' : 'idle'
      })
      .catch(() => {
        favState.value = 'idle' // 查询失败按未收藏处理，不影响浏览
      })
  }
})

/**
 * 商品 id 变化时重新查询状态（如路由切换复用组件）。
 */
watch(() => props.product.id, () => {
  if (userStore.isLogin) {
    favState.value = 'loading'
    getFavoriteStatus(props.product.id)
      .then(res => { favState.value = res.data ? 'favorited' : 'idle' })
      .catch(() => { favState.value = 'idle' })
  }
})

/** 点击收藏/取消收藏（幂等，后端保证重复点击不产生重复记录） */
async function onToggleFavorite() {
  // 未登录：引导登录（收藏是登录后才能使用的个人功能）
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    window.location.href = '/login'
    return
  }
  try {
    if (favState.value === 'favorited') {
      await removeFavorite(props.product.id)
      favState.value = 'idle'
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite(props.product.id)
      favState.value = 'favorited'
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    ElMessage.error('操作失败，请稍后再试')
  }
}

/** 图片加载失败：显示占位色块，避免裂图 */
function onImgError(event) {
  event.target.style.display = 'none'
  event.target.parentElement.classList.add('img-fallback')
}
</script>

<style scoped>
.product-card {
  position: relative;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.product-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-img {
  height: 200px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 图片加载失败时的占位样式 */
.img-fallback {
  background: linear-gradient(135deg, #fafafa, #f0f0f0);
}

.img-placeholder {
  color: #bbb;
  font-size: 13px;
}

/* 收藏按钮：默认半透明白底，收藏后橙色实心（淘宝风格） */
.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.fav-btn:hover {
  color: var(--mall-primary);
  background: #fff;
}

.fav-btn.active {
  color: var(--mall-primary);
  background: #fff;
}

.card-info {
  padding: 10px 12px;
}

.card-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.card-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: var(--mall-price);
}

.stock {
  font-size: 12px;
  color: #999;
}

.stock-low {
  color: #e04500;
}
</style>

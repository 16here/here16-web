<template>
  <!-- 收藏夹（淘宝风格：面包屑 + 商品网格，右上角统计；空态提示去逛逛） -->
  <div class="page-container page">
    <div class="crumb">首页 &gt; 收藏夹</div>

    <div class="fav-header">
      <h2 class="title">我的收藏</h2>
      <span class="count">共 {{ products.length }} 件</span>
      <!-- 一键清空收藏（确认后逐条调用删除接口） -->
      <el-button v-if="products.length" class="clear-btn" text type="danger" @click="onClearAll">清空收藏</el-button>
    </div>

    <!-- 收藏商品网格：复用商品卡片（卡片自带收藏按钮与状态） -->
    <div v-if="loading" class="empty-tip">加载中…</div>
    <div v-else-if="products.length" class="fav-grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
    <!-- 空态：引导去首页逛逛 -->
    <div v-else class="empty-box">
      <el-icon :size="64"><Star /></el-icon>
      <p>还没有收藏任何宝贝</p>
      <router-link to="/" class="go-home">去逛逛 &gt;</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { getFavorites, removeFavorite } from '../api/favorite'
import ProductCard from '../components/ProductCard.vue'

const products = ref([])
const loading = ref(false)

/** 拉取收藏夹列表（最新收藏在前） */
async function loadFavorites() {
  loading.value = true
  try {
    const res = await getFavorites()
    products.value = res.data || []
  } catch (e) {
    ElMessage.error('加载收藏夹失败')
  } finally {
    loading.value = false
  }
}

/** 清空收藏：确认后逐条删除（数量少，逐条调用简单可靠） */
async function onClearAll() {
  try {
    await ElMessageBox.confirm('确定清空全部收藏吗？', '提示', { type: 'warning' })
  } catch (e) {
    return // 用户取消
  }
  try {
    for (const p of products.value) {
      await removeFavorite(p.id)
    }
    products.value = []
    ElMessage.success('已清空收藏')
  } catch (e) {
    ElMessage.error('清空失败，请稍后再试')
  }
}

onMounted(loadFavorites)
</script>

<style scoped>
.page {
  min-height: 70vh;
  padding-bottom: 40px;
}

.crumb {
  font-size: 12px;
  color: #999;
  padding: 12px 0;
}

.fav-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0 16px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.count {
  font-size: 13px;
  color: #999;
}

.clear-btn {
  margin-left: auto;
}

/* 网格：与首页推荐楼层一致的卡片布局 */
.fav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .fav-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.empty-box {
  text-align: center;
  padding: 90px 0;
  color: #bbb;
}

.empty-box p {
  margin: 12px 0;
  font-size: 14px;
  color: #999;
}

.go-home {
  color: var(--mall-primary);
  font-size: 14px;
}

.empty-tip {
  padding: 60px 0;
  text-align: center;
  color: #999;
}
</style>

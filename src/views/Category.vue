<template>
  <!-- 分类商品列表页：面包屑 → 搜索/排序工具栏 → 商品网格 → 分页。
       支持 /category/:id（分类浏览）与 ?keyword=（关键词搜索）两种入口。 -->
  <div class="page-container category-page">
    <!-- 面包屑 -->
    <div class="crumb">
      <router-link to="/">首页</router-link>
      <span class="sep">/</span>
      <span v-if="currentCategory">{{ currentCategory.name }}</span>
      <span v-else-if="keyword">搜索：{{ keyword }}</span>
      <span v-else>全部商品</span>
    </div>

    <!-- 工具栏：搜索 + 排序 -->
    <div class="toolbar">
      <SearchBar
        ref="searchRef"
        :initial-keyword="keyword"
        placeholder="搜索商品名称或 SKU"
        @search="onSearch"
      />
      <div class="sort-group">
        <button :class="{ active: sortBy === 'default' }" @click="changeSort('default')">综合</button>
        <button :class="{ active: sortBy === 'price_asc' }" @click="changeSort('price_asc')">价格 ↑</button>
        <button :class="{ active: sortBy === 'price_desc' }" @click="changeSort('price_desc')">价格 ↓</button>
      </div>
      <span v-if="total > 0" class="total-text">共 {{ total }} 件商品</span>
    </div>

    <!-- 商品网格 -->
    <div v-loading="loading" class="goods-grid">
      <ProductCard v-for="item in list" :key="item.id" :product="item" />
      <el-empty
        v-if="!loading && list.length === 0"
        description="没有找到相关商品，试试其他关键词"
        :image-size="90"
      />
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, jumper, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProducts, getCategories } from '../api/product'
import ProductCard from '../components/ProductCard.vue'
import SearchBar from '../components/SearchBar.vue'

const route = useRoute()
const router = useRouter()

/** 分类 ID：0 表示全部分类 */
const categoryId = computed(() => Number(route.params.id) || 0)
/** 搜索关键词（来自路由 query） */
const keyword = computed(() => (route.query.keyword || '').trim())

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 12
const sortBy = ref('default')
const loading = ref(false)

/** 分类树：用于展示面包屑分类名 */
const categoryTree = ref([])

/** 当前分类信息（从树中查找，支持顶级与子分类） */
const currentCategory = computed(() => {
  for (const top of categoryTree.value) {
    if (top.id === categoryId.value) return top
    const child = (top.children || []).find((c) => c.id === categoryId.value)
    if (child) return child
  }
  return null
})

/** 加载分类树（供面包屑使用） */
async function loadCategories() {
  try {
    const res = await getCategories()
    categoryTree.value = res.data || []
  } catch {
    // 分类树加载失败不阻塞商品列表
  }
}

/** 拉取商品列表 */
async function loadProducts() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize,
      sortBy: sortBy.value
    }
    if (categoryId.value > 0) params.categoryId = categoryId.value
    if (keyword.value) params.keyword = keyword.value

    const res = await getProducts(params)
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    ElMessage.error('商品加载失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}

/** 搜索：更新路由 query（触发 watch 重新加载） */
function onSearch(kw) {
  router.push({
    path: `/category/${categoryId.value}`,
    query: kw ? { keyword: kw } : {}
  })
}

/** 切换排序并回到第一页 */
function changeSort(value) {
  sortBy.value = value
  page.value = 1
  loadProducts()
}

/** 翻页 */
function onPageChange(newPage) {
  page.value = newPage
  loadProducts()
}

// 路由参数（分类/关键词/页码变化）变化时重新加载
watch([categoryId, keyword, () => route.query.page], () => {
  page.value = Number(route.query.page) || 1
  loadProducts()
})

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.category-page {
  min-height: 60vh;
}

/* ---------- 面包屑 ---------- */
.crumb {
  padding: 14px 0 10px;
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

/* ---------- 工具栏 ---------- */
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.toolbar .search-bar {
  width: 360px;
}

.sort-group {
  display: flex;
  gap: 6px;
}

.sort-group button {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.sort-group button:hover {
  border-color: var(--mall-primary);
  color: var(--mall-primary);
}

.sort-group button.active {
  border-color: var(--mall-primary);
  background: var(--mall-primary);
  color: #fff;
}

.total-text {
  margin-left: auto;
  font-size: 13px;
  color: #999;
}

/* ---------- 商品网格 ---------- */
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  min-height: 300px;
}

/* ---------- 分页 ---------- */
.pagination {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
</style>

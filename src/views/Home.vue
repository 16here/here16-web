<template>
  <!-- 电商风格首页（参考淘宝网页端）：
       左侧分类导航 → Banner 轮播 → 快捷入口 → 热门商品。
       阶段 1 全部区块接入真实接口数据。 -->
  <div class="home">
    <!-- ---------- 1. 主区：左侧分类导航（淘宝式竖排）+ Banner 轮播 ---------- -->
    <div class="page-container banner-wrap">
      <!-- 左侧分类导航：13 个顶级分类竖排，hover 弹出子分类面板（纯 CSS 实现） -->
      <div class="side-nav">
        <div class="side-nav-title">商品分类</div>
        <ul class="side-nav-list">
          <li
            v-for="cat in topCategories"
            :key="cat.id"
            class="side-nav-item"
            @mouseenter="hoverCat = cat"
            @mouseleave="hoverCat = null"
          >
            <span class="side-nav-name" @click="$router.push(`/category/${cat.id}`)">
              {{ cat.name }}
              <el-icon class="nav-arrow"><ArrowRight /></el-icon>
            </span>
            <!-- 子分类浮层：有子分类时 hover 显示 -->
            <div v-if="cat.children && cat.children.length" class="child-panel" @click.stop>
              <a
                v-for="child in cat.children"
                :key="child.id"
                class="child-link"
                @click="$router.push(`/category/${child.id}`)"
              >
                {{ child.name }}
              </a>
            </div>
          </li>
          <li class="side-nav-item all-item" @click="$router.push('/category/0')">
            <span class="side-nav-name">全部商品分类</span>
          </li>
        </ul>
      </div>

      <!-- Banner 轮播（真实热门商品封面） -->
      <el-carousel
        v-if="bannerProducts.length > 0"
        class="banner"
        height="300px"
        :interval="4000"
        arrow="hover"
        indicator-position="outside"
      >
        <el-carousel-item v-for="item in bannerProducts" :key="item.id">
          <div class="banner-slide" @click="$router.push(`/product/${item.id}`)">
            <img v-if="item.cover" :src="item.cover" :alt="item.name" @error="onBannerImgError" />
            <div class="banner-overlay"></div>
            <div class="banner-text">
              <span class="banner-tag">热门推荐</span>
              <h2>{{ item.name }}</h2>
              <p class="banner-price">¥ {{ item.price.toFixed(2) }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <!-- 数据未就绪时的兜底轮播占位 -->
      <el-carousel v-else class="banner" height="300px" :interval="0" arrow="never">
        <el-carousel-item>
          <div class="banner-slide banner-placeholder">
            <div class="banner-text">
              <h2>欢迎来到 MALL 商城</h2>
              <p>商品模块已上线，海量好物等你发现</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- ---------- 3. 快捷入口 ---------- -->
    <div class="page-container">
      <div class="quick-entry">
        <div v-for="entry in quickEntries" :key="entry.name" class="entry-item" @click="onEntryClick(entry)">
          <div class="entry-icon" :style="{ background: entry.color }">{{ entry.name.charAt(0) }}</div>
          <span>{{ entry.name }}</span>
        </div>
      </div>
    </div>

    <!-- ---------- 4. 推荐楼层（阶段 10：登录=猜你喜欢，未登录=热门推荐） ---------- -->
    <div class="page-container">
      <RecommendList
        :title="recommend.title || (userStore.isLogin ? '猜你喜欢' : '热门推荐')"
        :reason="recommend.reason"
        :products="recommend.products"
        :loading="loading"
      />
    </div>

    <!-- ---------- 5. 底部 ---------- -->
    <footer class="footer">
      <div class="page-container">
        MALL 商城 · 分阶段开发演示项目 · 当前阶段 10（推荐系统）
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { getCategories } from '../api/product'
import { getHomeRecommend } from '../api/recommend'
import { useUserStore } from '../store/user'
import RecommendList from '../components/RecommendList.vue'

const router = useRouter()
const userStore = useUserStore()

/** 分类树（顶级分类，含 children 子分类） */
const topCategories = ref([])
/** 当前 hover 的顶级分类（用于左侧分类导航浮层） */
const hoverCat = ref(null)
/** 推荐楼层数据（首页推荐位接口：未登录=热门推荐，登录=猜你喜欢） */
const recommend = ref({ title: '', reason: '', products: [] })
const loading = ref(false)

/** 轮播取推荐商品前 3 个（热门/猜你喜欢里最值得展示的） */
const bannerProducts = computed(() => recommend.value.products.slice(0, 3))

/** 快捷入口 */
const quickEntries = [
  { name: '新品首发', color: '#ff5000', target: '/category/0' },
  { name: '限时抢购', color: '#ff7a3d', target: '/category/0' },
  { name: '品牌闪购', color: '#e04500', target: null },
  { name: '聚划算', color: '#ff9d00', target: null }
]

/** 加载分类树与首页推荐（行为数据驱动，登录后自动个性化） */
async function loadData() {
  loading.value = true
  try {
    const [catRes, recRes] = await Promise.all([
      getCategories(),
      getHomeRecommend(8)
    ])
    // 后端分类树返回的 roots 即顶级分类
    topCategories.value = catRes.data || []
    recommend.value = recRes.data || { title: '', reason: '', products: [] }
  } catch (error) {
    ElMessage.error('首页数据加载失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}

/** 快捷入口点击：有目标跳转，无目标提示后续开放 */
function onEntryClick(entry) {
  if (entry.target) {
    router.push(entry.target)
  } else {
    ElMessage.info('该活动页将在对应模块上线后开放')
  }
}

/** Banner 图片加载失败：隐藏图片保留渐变遮罩 */
function onBannerImgError(event) {
  event.target.style.display = 'none'
}

onMounted(loadData)
</script>

<style scoped>
/* 页面容器：左右布局无需旧的横排导航条样式 *//* ---------- Banner 主区（左侧分类导航 + 右侧轮播） ---------- */
.banner-wrap {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  align-items: stretch;
}

/* 左侧分类导航：白底竖排，hover 橙色，右侧浮出子分类面板 */
.side-nav {
  width: 210px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.side-nav-title {
  height: 40px;
  line-height: 40px;
  padding: 0 16px;
  background: var(--mall-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.side-nav-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.side-nav-item {
  position: relative;
  height: 38px;
  line-height: 38px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.side-nav-item:hover {
  background: var(--mall-primary-light);
  color: var(--mall-primary);
  font-weight: 600;
}

.side-nav-name {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-arrow {
  font-size: 12px;
  opacity: 0.5;
  transition: transform 0.2s;
}

.side-nav-item:hover .nav-arrow {
  transform: translateX(3px);
  opacity: 1;
}

.all-item {
  border-top: 1px dashed #f0f0f0;
  color: #999;
}

.all-item:hover {
  color: var(--mall-primary);
  font-weight: 600;
}

/* 子分类浮层：hover 顶级分类时从右侧浮出（纯 CSS 控制显隐） */
.child-panel {
  position: absolute;
  left: 210px;
  top: 0;
  min-width: 140px;
  background: #fff;
  border: 1px solid #ffd9c0;
  border-radius: 0 6px 6px 0;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.08);
  padding: 8px 0;
  display: none;
  z-index: 20;
}

.side-nav-item:hover .child-panel {
  display: block;
}

.child-link {
  display: block;
  padding: 6px 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.child-link:hover {
  color: var(--mall-primary);
  background: var(--mall-primary-light);
}

.banner {
  flex: 1;
  min-width: 0;
  border-radius: 6px;
  overflow: hidden;
}

.banner-slide {
  position: relative;
  height: 100%;
  background: linear-gradient(120deg, #ff5000 0%, #ff7a3d 45%, #ff9d5c 100%);
  cursor: pointer;
}

.banner-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 60%);
}

.banner-text {
  position: absolute;
  left: 60px;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  max-width: 55%;
}

.banner-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #ffe4d9;
  color: var(--mall-primary);
  border-radius: 3px;
  font-size: 12px;
  margin-bottom: 10px;
}

.banner-text h2 {
  font-size: 30px;
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.banner-price {
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.banner-placeholder .banner-text h2 {
  font-size: 34px;
}

.banner-placeholder .banner-text p {
  font-size: 16px;
  opacity: 0.92;
}

/* ---------- 快捷入口 ---------- */
.quick-entry {
  margin-top: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 18px 0;
  display: flex;
  justify-content: space-around;
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.entry-item:hover {
  color: var(--mall-primary);
}

.entry-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---------- 底部 ---------- */
.footer {
  margin-top: 24px;
  padding: 20px 0;
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>

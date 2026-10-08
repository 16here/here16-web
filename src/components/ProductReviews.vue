<template>
  <!-- 商品评价区块（阶段 7）：评分概览 + 已发布评价列表 + 分页 -->
  <div class="reviews-section">
    <h3 class="floor-title">商品评价</h3>

    <!-- 评分概览 -->
    <div class="stats-box" v-if="stats">
      <div class="stats-left">
        <span class="avg">{{ Number(stats.avgRating).toFixed(1) }}</span>
        <div class="stars">
          <el-rate :model-value="Math.round(stats.avgRating)" disabled />
        </div>
        <span class="count">共 {{ stats.totalCount }} 条评价</span>
      </div>
      <div class="stats-right">
        <!-- 星级分布条（5 星占比百分比） -->
        <div
          v-for="n in [5, 4, 3, 2, 1]"
          :key="n"
          class="bar-row"
        >
          <span class="bar-label">{{ n }} 星</span>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: percentOf(n) + '%' }"></div>
          </div>
          <span class="bar-num">{{ countOf(n) }}</span>
        </div>
      </div>
    </div>

    <!-- 评价列表 -->
    <template v-if="reviews.length > 0">
      <div v-for="review in reviews" :key="review.id" class="review-item">
        <div class="review-head">
          <span class="username">{{ review.username || '匿名用户' }}</span>
          <el-rate :model-value="review.rating" disabled class="rate" />
          <span class="time">{{ formatTime(review.createdAt) }}</span>
        </div>
        <p class="content">{{ review.content }}</p>
        <div v-if="review.images && review.images.length" class="imgs">
          <img
            v-for="(img, idx) in review.images"
            :key="idx"
            :src="img"
            class="review-img"
            alt="评价图片"
            @error="onImgError"
          />
        </div>
        <!-- 商家回复 -->
        <div v-if="review.reply" class="reply-box">
          <p class="reply-head">商家回复（{{ formatTime(review.replyAt) }}）：</p>
          <p class="reply-text">{{ review.reply }}</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="load"
        />
      </div>
    </template>

    <el-empty v-else-if="!loading" description="暂无评价，买过的亲快来点评吧" :image-size="80" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getProductReviews, getReviewStats } from '../api/review'

/**
 * 商品评价组件。
 * @prop productId 商品 ID（变化时自动重新加载）
 */
const props = defineProps({
  productId: { type: [Number, String], required: true }
})

const stats = ref(null)
const reviews = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 5
const total = ref(0)

/** 加载评分统计 */
async function loadStats() {
  try {
    const res = await getReviewStats(props.productId)
    stats.value = res.data
  } catch (e) {
    // 拦截器已提示；统计失败不影响列表展示
  }
}

/** 加载评价列表 */
async function load() {
  loading.value = true
  try {
    const res = await getProductReviews(props.productId, { page: page.value, pageSize })
    reviews.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 星级数量（无评价时显示 0） */
function countOf(n) {
  return stats.value ? Number(stats.value[['five', 'four', 'three', 'two', 'one'][5 - n]] || 0) : 0
}

/** 星级占比（用于分布条宽度） */
function percentOf(n) {
  const totalCount = Number(stats.value?.totalCount || 0)
  if (totalCount === 0) return 0
  return Math.round((countOf(n) / totalCount) * 100)
}

/** 图片加载失败兜底 */
function onImgError(event) {
  event.target.src = '/default-product.svg'
}

/** 时间显示 */
function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadStats()
  load()
})

// 商品切换时重新加载
watch(
  () => props.productId,
  () => {
    page.value = 1
    loadStats()
    load()
  }
)
</script>

<style scoped>
.reviews-section {
  margin-top: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.floor-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 4px solid var(--mall-primary);
}

/* ---------- 评分概览 ---------- */
.stats-box {
  display: flex;
  gap: 40px;
  background: #fffaf5;
  border: 1px solid #ffead9;
  border-radius: 6px;
  padding: 16px 24px;
  margin-bottom: 16px;
}

.stats-left {
  flex: 0 0 200px;
  text-align: center;
}

.avg {
  font-size: 42px;
  font-weight: 700;
  color: var(--mall-price);
  line-height: 1;
}

.stars {
  margin: 6px 0;
}

.count {
  font-size: 12px;
  color: #999;
}

.stats-right {
  flex: 1;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.bar-label {
  flex: 0 0 40px;
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #f0f0f0;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--mall-primary);
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-num {
  flex: 0 0 24px;
  color: #999;
}

/* ---------- 评价列表 ---------- */
.review-item {
  border-bottom: 1px solid #f5f5f5;
  padding: 14px 0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.rate :deep(.el-rate__icon) {
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #bbb;
  margin-left: auto;
}

.content {
  margin-top: 8px;
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.imgs {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.review-img {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

.reply-box {
  margin-top: 10px;
  background: #fafafa;
  border-radius: 4px;
  padding: 10px 12px;
}

.reply-head {
  font-size: 12px;
  color: var(--mall-primary);
  font-weight: 600;
}

.reply-text {
  margin-top: 4px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

.pager {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}
</style>

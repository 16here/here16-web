<template>
  <!-- 我的优惠券（阶段 8）：状态 Tab + 券卡片列表 + 分页 -->
  <div v-loading="loading" class="page-container my-coupons">
    <div class="page-head">
      <h2>我的优惠券</h2>
      <router-link to="/coupons" class="center-link">去领券中心 ›</router-link>
    </div>

    <!-- 状态 Tab：全部 / 未使用 / 已使用 / 已过期 -->
    <el-tabs v-model="activeTab" class="tabs" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="未使用" name="0" />
      <el-tab-pane label="已使用" name="2" />
      <el-tab-pane label="已过期" name="3" />
    </el-tabs>

    <div v-if="list.length > 0" class="coupon-grid">
      <CouponCard v-for="c in list" :key="c.id" :coupon="c" mode="mine" />
    </div>
    <el-empty v-else-if="!loading" description="暂无该状态的优惠券" :image-size="90" />

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CouponCard from '../components/CouponCard.vue'
import { getMyCoupons } from '../api/coupon'

const loading = ref(false)
const activeTab = ref('all')
const list = ref([])
const page = ref(1)
const pageSize = 10
const total = ref(0)

/** 按 Tab + 分页拉取我的券 */
async function load() {
  loading.value = true
  try {
    // Tab name：all / 0 / 2 / 3；后端 status 为空 = 全部
    const status = activeTab.value === 'all' ? null : Number(activeTab.value)
    const res = await getMyCoupons({ status, page: page.value, pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  page.value = 1
  load()
}

function onPageChange(p) {
  page.value = p
  load()
}

onMounted(load)
</script>

<style scoped>
.my-coupons {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
}

.center-link {
  font-size: 13px;
  color: var(--mall-primary);
}

.tabs :deep(.el-tabs__item.is-active) {
  color: var(--mall-primary);
}

.tabs :deep(.el-tabs__active-bar) {
  background-color: var(--mall-primary);
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
  margin-top: 6px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>

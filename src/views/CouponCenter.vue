<template>
  <!-- 领券中心（阶段 8）：展示上架中的券模板，未登录可逛、登录后领取 -->
  <div v-loading="loading" class="page-container coupon-center">
    <div class="page-head">
      <h2>领券中心</h2>
      <router-link to="/my-coupons" class="mine-link">我的优惠券 ›</router-link>
    </div>

    <div v-if="coupons.length > 0" class="coupon-grid">
      <CouponCard
        v-for="c in coupons"
        :key="c.id"
        :coupon="c"
        mode="center"
        @receive="onReceive"
      />
    </div>
    <el-empty v-else-if="!loading" description="暂无上架中的优惠券，敬请期待" :image-size="90" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CouponCard from '../components/CouponCard.vue'
import { getCouponCenter, receiveCoupon } from '../api/coupon'
import { useUserStore } from '../store/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const coupons = ref([])

/** 拉取领券中心列表（公开接口，未登录也能逛） */
async function load() {
  loading.value = true
  try {
    const res = await getCouponCenter()
    coupons.value = res.data || []
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 领取：未登录先去登录页；成功后刷新按钮态 */
async function onReceive(coupon) {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再领取')
    router.push('/login')
    return
  }
  try {
    const res = await receiveCoupon(coupon.id)
    ElMessage.success('领取成功，可在「我的优惠券」查看')
    // 领取成功 → 该券按钮态改为已领取
    const target = coupons.value.find((c) => c.id === coupon.id)
    if (target) target.received = true
    // 顺带确认后端返回的是未使用状态
    if (res.data && res.data.status !== 0) {
      ElMessage.warning('该券当前状态异常，请到我的优惠券查看')
    }
  } catch (e) {
    // 拦截器已提示（如限领、已过期）
  }
}

onMounted(load)
</script>

<style scoped>
.coupon-center {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
}

.mine-link {
  font-size: 13px;
  color: var(--mall-primary);
}

/* 券卡片网格 */
.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
</style>

<template>
  <!-- 管理端后台布局：左侧菜单 + 顶栏 + 内容区 -->
  <el-container class="admin-layout">
    <!-- ---------- 侧边菜单 ---------- -->
    <el-aside width="200px" class="aside">
      <div class="logo">MALL 管理后台</div>
      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/payments">
          <el-icon><Money /></el-icon>
          <span>支付管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><Box /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <!-- 阶段 7：评价审核 / 售后处理 -->
        <el-menu-item index="/reviews">
          <el-icon><ChatLineRound /></el-icon>
          <span>评价管理</span>
        </el-menu-item>
        <el-menu-item index="/after-sales">
          <el-icon><Service /></el-icon>
          <span>售后管理</span>
        </el-menu-item>
        <!-- 阶段 8：优惠券模板 / 营销活动 -->
        <el-menu-item index="/coupons">
          <el-icon><Ticket /></el-icon>
          <span>优惠券管理</span>
        </el-menu-item>
        <el-menu-item index="/promotions">
          <el-icon><Present /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        <!-- 阶段 9：运单列表 / 轨迹同步 -->
        <el-menu-item index="/shipping">
          <el-icon><Van /></el-icon>
          <span>物流管理</span>
        </el-menu-item>
        <!-- 阶段 10：推荐位配置 / 热门商品行为构成 -->
        <el-menu-item index="/recommend">
          <el-icon><DataAnalysis /></el-icon>
          <span>推荐管理</span>
        </el-menu-item>
        <!-- 阶段 11.6：人工客服与工单系统 -->
        <el-menu-item index="/agents">
          <el-icon><Headset /></el-icon>
          <span>客服工作台</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- ---------- 右侧主体 ---------- -->
    <el-container class="main">
      <el-header class="header">
        <span class="page-title">{{ route.meta.title || '控制台' }}</span>
        <div class="user-area">
          <span class="username">
            {{ adminStore.adminInfo?.username || '管理员' }}
            <el-tag size="small" type="warning" class="role-tag">ADMIN</el-tag>
          </span>
          <el-button link type="danger" @click="onLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Goods, Menu, Tickets, Money, Box, ChatLineRound, Service, Ticket, Present, Van, DataAnalysis, Headset } from '@element-plus/icons-vue'
import { useAdminUserStore } from '../store/adminUser'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminUserStore()

/** 当前路由高亮：匹配侧边菜单项 */
const activeMenu = computed(() => {
  if (route.path.startsWith('/categories')) return '/categories'
  if (route.path.startsWith('/orders')) return '/orders'
  if (route.path.startsWith('/payments')) return '/payments'
  if (route.path.startsWith('/inventory')) return '/inventory'
  if (route.path.startsWith('/reviews')) return '/reviews'
  if (route.path.startsWith('/after-sales')) return '/after-sales'
  if (route.path.startsWith('/coupons')) return '/coupons'
  if (route.path.startsWith('/promotions')) return '/promotions'
  if (route.path.startsWith('/shipping')) return '/shipping'
  if (route.path.startsWith('/recommend')) return '/recommend'
  if (route.path.startsWith('/agents')) return '/agents'
  return '/products'
})

/** 退出登录并回登录页 */
async function onLogout() {
  await adminStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

/* ---------- 侧边栏 ---------- */
.aside {
  background: #1d2939;
  color: #fff;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menu {
  border-right: none;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  color: #b6c2d0;
}

.menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: var(--mall-primary);
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

/* ---------- 右侧主体 ---------- */
.main {
  background: #f5f7fa;
}

.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.content {
  padding: 16px;
}
</style>

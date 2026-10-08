<template>
  <!-- 电商风格顶部导航（参考淘宝网页端布局）：
       第一层浅灰顶栏（登录态/入口），第二层主区（Logo + 大搜索框 + 购物车） -->
  <header class="header">
    <!-- ---------- 顶栏 ---------- -->
    <div class="topbar">
      <div class="page-container topbar-inner">
        <span class="welcome">欢迎来到 MALL 商城</span>
        <div class="topbar-right">
          <!-- 已登录：用户名 + 下拉菜单 -->
          <template v-if="userStore.isLogin">
            <el-dropdown @command="onUserCommand">
              <span class="user-link">
                <el-icon><User /></el-icon>
                {{ userStore.nickname }}
                <el-icon class="arrow"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="coupons">我的优惠券</el-dropdown-item>
                  <el-dropdown-item command="afterSales">我的售后</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <!-- 未登录：登录 / 注册入口 -->
          <template v-else>
            <router-link to="/login" class="top-link">请登录</router-link>
            <span class="sep">|</span>
            <router-link to="/register" class="top-link">免费注册</router-link>
          </template>
          <span class="sep">|</span>
          <router-link to="/orders" class="top-link">我的订单</router-link>
          <span class="sep">|</span>
          <router-link to="/after-sales" class="top-link">我的售后</router-link>
          <span class="sep">|</span>
          <!-- 收藏夹入口（需登录；未登录点进会触发路由守卫跳登录页） -->
          <router-link to="/favorites" class="top-link">收藏夹</router-link>
          <span class="sep">|</span>
          <router-link to="/coupons" class="top-link">领券中心</router-link>
          <span class="sep">|</span>
          <router-link to="/address" class="top-link">收货地址</router-link>
        </div>
      </div>
    </div>

    <!-- ---------- 主区：Logo + 搜索 + 购物车 ---------- -->
    <div class="header-main">
      <div class="page-container header-inner">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <span class="logo-text">MALL</span>
          <span class="slogan">品质好物 一网打尽</span>
        </router-link>

        <!-- 大搜索框：跳转分类列表页并携带关键词 -->
        <div class="search-box">
          <el-input v-model="keyword" class="search-input" placeholder="搜索 女装/手机/家电…" clearable @keyup.enter="onSearch" />
          <button class="search-btn" @click="onSearch">搜索</button>
        </div>

        <!-- 购物车（角标实时显示购物车总件数） -->
        <router-link to="/cart" class="cart-btn">
          <el-badge :value="cartCount" :hidden="cartCount === 0">
            <el-icon :size="18"><ShoppingCart /></el-icon>
          </el-badge>
          <span>购物车</span>
        </router-link>
      </div>

      <!-- 热门搜索词（淘宝风格：放在搜索框下方，点击即搜索） -->
      <div class="hot-words">
        <span class="hot-label">热门搜索：</span>
        <a v-for="w in hotWords" :key="w" class="hot-word" @click.prevent="onHotWord(w)">{{ w }}</a>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, User, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { useCartStore } from '../store/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const keyword = ref('')

/**
 * 热门搜索词（淘宝风格：Header 主区下方一排可点击词条）。
 * 覆盖当前商品库中的高热度类目，点击直接触发搜索跳转。
 */
const hotWords = ['笔记本电脑', '机械键盘', '四件套', '纸尿裤', '枣花蜜', '双肩包', '运动鞋']

/**
 * 购物车角标：直接绑定 cart store 的总件数。
 * 已登录时来自后端购物车；未登录时来自本地购物车；登录/登出自动切换。
 */
const cartCount = computed(() => cartStore.totalCount)

/** 挂载时初始化购物车（幂等：已登录拉后端，未登录读本地） */
onMounted(() => {
  cartStore.init()
})

/** 搜索：跳转分类列表页（id=0 表示全部商品），携带关键词触发真实搜索 */
function onSearch() {
  const kw = keyword.value.trim()
  router.push({ path: '/category/0', query: kw ? { keyword: kw } : {} })
}

/** 点击热门搜索词：把词填入搜索框并直接搜索 */
function onHotWord(w) {
  keyword.value = w
  router.push({ path: '/category/0', query: { keyword: w } })
}

/** 顶栏用户下拉菜单指令 */
async function onUserCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'orders') {
    router.push('/orders')
  } else if (command === 'coupons') {
    router.push('/my-coupons')
  } else if (command === 'afterSales') {
    router.push('/after-sales')
  } else if (command === 'logout') {
    await userStore.logout()
    // 登出后重置购物车为本地模式（清掉上一个用户的购物车数据）
    cartStore.resetToLocal()
    ElMessage.success('已退出登录')
    router.push('/')
  }
}
</script>

<style scoped>
/* ---------- 顶栏 ---------- */
.topbar {
  height: 30px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  color: #666;
}

.topbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-link {
  color: #666;
}

.top-link:hover {
  color: var(--mall-primary);
}

.sep {
  color: #ddd;
}

.user-link {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: var(--mall-primary);
  outline: none;
}

.arrow {
  font-size: 12px;
}

/* ---------- 主区 ---------- */
.header-main {
  min-height: 78px;
  padding: 14px 0;
  background: #fff;
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-text {
  font-size: 30px;
  font-weight: 800;
  color: var(--mall-primary);
  letter-spacing: 1px;
}

.slogan {
  font-size: 12px;
  color: #999;
}

/* 搜索区：弹性占据中间空间 */
.search-box {
  flex: 1;
  max-width: 560px;
  display: flex;
  align-items: center;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 4px 0 0 4px;
  box-shadow: 0 0 0 2px var(--mall-primary) inset;
}

.search-btn {
  height: 32px;
  padding: 0 20px;
  border: none;
  border-radius: 0 4px 4px 0;
  background: var(--mall-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.search-btn:hover {
  background: var(--mall-primary-dark);
}

/* 购物车按钮 */
.cart-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 2px solid var(--mall-primary);
  border-radius: 4px;
  color: var(--mall-primary);
  font-size: 14px;
  background: #fff;
}

.cart-btn:hover {
  background: var(--mall-primary-light);
}

/* ---------- 热门搜索词条（淘宝风格：主区下方灰底一行） ---------- */
.hot-words {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 0;
  font-size: 12px;
  color: #999;
}

.hot-label {
  color: #999;
}

.hot-word {
  color: #666;
  cursor: pointer;
}

.hot-word:hover {
  color: var(--mall-primary);
}

.hot-word + .hot-word::before {
  content: '·';
  margin-right: 8px;
  color: #ddd;
}
</style>

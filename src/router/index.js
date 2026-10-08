import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

/**
 * 前端路由表。
 *
 * - requiresAuth: true 表示该页面需要登录，未登录跳转登录页并记录来源；
 * - 页面组件全部懒加载，减小首屏体积。
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    // 分类商品列表：id=0 表示全部商品；支持 ?keyword= 关键词搜索
    path: '/category/:id',
    name: 'Category',
    component: () => import('../views/Category.vue'),
    meta: { title: '分类商品' }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/order/create',
    name: 'OrderCreate',
    component: () => import('../views/OrderCreate.vue'),
    meta: { title: '确认订单', requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('../views/OrderList.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    // 注意：/pay/result 必须声明在 /pay/:orderId 之前，
    // 否则静态路径会被动态段 (:orderId) 吞掉
    path: '/pay/result',
    name: 'PaymentResult',
    component: () => import('../views/PaymentResult.vue'),
    meta: { title: '支付结果', requiresAuth: true }
  },
  {
    path: '/pay/:orderId',
    name: 'Payment',
    component: () => import('../views/Payment.vue'),
    meta: { title: '收银台', requiresAuth: true }
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
    meta: { title: '收货地址', requiresAuth: true }
  },
  {
    // 评价晒单（已完成订单逐条评价）
    path: '/order/review/:id',
    name: 'OrderReview',
    component: () => import('../views/OrderReview.vue'),
    meta: { title: '评价晒单', requiresAuth: true }
  },
  {
    // 商品评价列表（公开）
    path: '/reviews/:productId',
    name: 'ReviewList',
    component: () => import('../views/ReviewList.vue'),
    meta: { title: '商品评价' }
  },
  {
    // 申请售后（可携带 ?orderId= 直接定位订单）
    path: '/after-sales/apply',
    name: 'AfterSaleApply',
    component: () => import('../views/AfterSaleApply.vue'),
    meta: { title: '申请售后', requiresAuth: true }
  },
  {
    path: '/after-sales',
    name: 'AfterSaleList',
    component: () => import('../views/AfterSaleList.vue'),
    meta: { title: '我的售后', requiresAuth: true }
  },
  {
    // 领券中心（阶段 8）：公开，未登录也能逛
    path: '/coupons',
    name: 'CouponCenter',
    component: () => import('../views/CouponCenter.vue'),
    meta: { title: '领券中心' }
  },
  {
    // 我的优惠券（阶段 8）：需登录
    path: '/my-coupons',
    name: 'MyCoupons',
    component: () => import('../views/MyCoupons.vue'),
    meta: { title: '我的优惠券', requiresAuth: true }
  },
  {
    // 物流跟踪（阶段 9）：待收货订单查看轨迹时间轴，需登录
    path: '/logistics/:orderId',
    name: 'Logistics',
    component: () => import('../views/Logistics.vue'),
    meta: { title: '物流跟踪', requiresAuth: true }
  },
  {
    // 收藏夹（阶段 11 需求 3）：需登录
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue'),
    meta: { title: '收藏夹', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ---------- 全局前置守卫：登录态校验 ----------
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 需要登录但未登录：跳登录页，携带 redirect 参数便于登录后跳回
  if (to.meta.requiresAuth && !userStore.isLogin) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  // 已登录访问登录/注册页：直接回首页
  if ((to.path === '/login' || to.path === '/register') && userStore.isLogin) {
    next('/')
    return
  }
  next()
})

// 设置页面标题
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 商城` : '商城'
})

export default router

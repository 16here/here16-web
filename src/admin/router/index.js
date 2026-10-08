import { createRouter, createWebHashHistory } from 'vue-router'
import { useAdminUserStore } from '../store/adminUser'

/**
 * 管理端路由表。
 *
 * - '/' 为后台布局（侧边菜单 + 内容区），业务页挂在 children 下；
 * - meta.requiresAdmin: true 表示仅 ADMIN 角色可访问；
 * - 守卫逻辑：未登录跳登录页；非 ADMIN 角色访问管理页则提示无权限。
 * - 使用 hash 模式：管理端入口为 /admin.html，hash 路由避免刷新后 404。
 */
const routes = [
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/Login.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '控制台', requiresAdmin: true },
    redirect: '/products',
    children: [
      {
        path: 'products',
        name: 'ProductManage',
        component: () => import('../views/ProductManage.vue'),
        meta: { title: '商品管理', requiresAdmin: true }
      },
      {
        path: 'categories',
        name: 'CategoryManage',
        component: () => import('../views/CategoryManage.vue'),
        meta: { title: '分类管理', requiresAdmin: true }
      },
      {
        path: 'orders',
        name: 'OrderManage',
        component: () => import('../views/OrderManage.vue'),
        meta: { title: '订单管理', requiresAdmin: true }
      },
      {
        path: 'payments',
        name: 'PaymentManage',
        component: () => import('../views/PaymentManage.vue'),
        meta: { title: '支付管理', requiresAdmin: true }
      },
      {
        path: 'inventory',
        name: 'InventoryManage',
        component: () => import('../views/InventoryManage.vue'),
        meta: { title: '库存管理', requiresAdmin: true }
      },
      {
        // 阶段 7：评价审核与商家回复
        path: 'reviews',
        name: 'ReviewManage',
        component: () => import('../views/ReviewManage.vue'),
        meta: { title: '评价管理', requiresAdmin: true }
      },
      {
        // 阶段 7：售后审核与退款操作
        path: 'after-sales',
        name: 'AfterSaleManage',
        component: () => import('../views/AfterSaleManage.vue'),
        meta: { title: '售后管理', requiresAdmin: true }
      },
      {
        // 阶段 8：优惠券模板管理（增删改查 + 定向发放）
        path: 'coupons',
        name: 'CouponManage',
        component: () => import('../views/CouponManage.vue'),
        meta: { title: '优惠券管理', requiresAdmin: true }
      },
      {
        // 阶段 8：营销活动管理（满减/折扣/秒杀 + 启停）
        path: 'promotions',
        name: 'PromotionManage',
        component: () => import('../views/PromotionManage.vue'),
        meta: { title: '活动管理', requiresAdmin: true }
      },
      {
        // 阶段 9：物流管理（运单列表 + 轨迹同步）
        path: 'shipping',
        name: 'ShippingManage',
        component: () => import('../views/ShippingManage.vue'),
        meta: { title: '物流管理', requiresAdmin: true }
      },
      {
        // 阶段 10：推荐系统（推荐位配置 + 热门商品行为构成）
        path: 'recommend',
        name: 'RecommendManage',
        component: () => import('../views/RecommendManage.vue'),
        meta: { title: '推荐管理', requiresAdmin: true }
      },
      {
        // 阶段 11.6：人工客服与工单系统（客服管理 + 会话工作台）
        path: 'agents',
        name: 'AgentWorkbench',
        component: () => import('../views/AgentWorkbench.vue'),
        meta: { title: '客服工作台', requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ---------- 全局前置守卫：ADMIN 权限校验 ----------
router.beforeEach((to, from, next) => {
  const adminStore = useAdminUserStore()

  // 需要 ADMIN 权限但未登录：跳登录页
  if (to.meta.requiresAdmin && !adminStore.isLogin) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 需要 ADMIN 权限但角色不符（理论上不会出现，防御性处理）
  if (to.meta.requiresAdmin && !adminStore.isAdmin) {
    next('/login')
    return
  }

  // 已登录访问登录页：直接进控制台
  if (to.path === '/login' && adminStore.isLogin) {
    next('/')
    return
  }

  next()
})

// 设置页面标题
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 商城管理后台` : '商城管理后台'
})

export default router

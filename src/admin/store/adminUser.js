import { defineStore } from 'pinia'
import { adminLogin } from '../api/auth'

/**
 * 管理员状态（Pinia store）。
 *
 * 保存管理员 token 与角色信息，用于路由守卫判断 ADMIN 权限。
 * 阶段 1~4：管理端登录复用用户登录接口换取 token，角色固定 ADMIN；
 * 阶段 5：后端登录返回体新增 role（UserVO.role），管理端从 user.role 读取真实角色，
 * 后端 /api/admin/** 已按 hasRole("ADMIN") 鉴权——普通用户即使拿到 token 也无法访问管理接口。
 */
export const useAdminUserStore = defineStore('adminUser', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    // 角色：阶段 5 起由后端登录返回（USER/ADMIN）
    role: localStorage.getItem('admin_role') || '',
    adminInfo: JSON.parse(localStorage.getItem('admin_user') || 'null')
  }),

  getters: {
    /** 是否已登录（有 token 即视为登录） */
    isLogin: (state) => !!state.token,
    /** 是否具备管理员权限（守卫据此放行 /api/admin/** 页面） */
    isAdmin: (state) => state.role === 'ADMIN'
  },

  actions: {
    /**
     * 管理员登录（复用用户登录接口）。
     *
     * @param payload { username, password }（表单字段名 username，接口字段名 account，这里做映射）
     * 后端返回 { token, user }，user.role 为真实角色（阶段 5）。
     */
    async login(payload) {
      const res = await adminLogin({
        account: payload.username,
        password: payload.password
      })
      this.token = res.data.token
      this.adminInfo = res.data.user || res.data.adminInfo || null
      this.role = this.adminInfo?.role || 'USER'
      localStorage.setItem('admin_token', this.token)
      localStorage.setItem('admin_role', this.role)
      localStorage.setItem('admin_user', JSON.stringify(this.adminInfo))
      return res
    },

    /** 登出：清理本地管理端登录态 */
    async logout() {
      this.token = ''
      this.role = ''
      this.adminInfo = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_role')
      localStorage.removeItem('admin_user')
    }
  }
})

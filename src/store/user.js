import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister, getUserInfo, logout as apiLogout } from '../api/auth'

/**
 * 用户状态（Pinia store）。
 *
 * 职责：
 * - 保存 token 与 userInfo（同步持久化到 localStorage，刷新不丢）；
 * - 提供 login / register / logout / fetchUserInfo action；
 * - 组件通过 store.isLogin 判断登录态，避免到处读 localStorage。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('mall_token') || '',
    userInfo: JSON.parse(localStorage.getItem('mall_user') || 'null')
  }),

  getters: {
    /** 是否已登录 */
    isLogin: (state) => !!state.token,
    /** 展示用用户名 */
    nickname: (state) => state.userInfo?.username || ''
  },

  actions: {
    /**
     * 登录：调用后端接口，成功后保存 token 与用户信息。
     * @returns 后端返回的完整 Result（含 token、user）
     */
    async login(payload) {
      const res = await apiLogin(payload)
      this.token = res.data.token
      this.userInfo = res.data.user
      localStorage.setItem('mall_token', this.token)
      localStorage.setItem('mall_user', JSON.stringify(this.userInfo))
      return res
    },

    /** 注册：注册成功后不自动登录，由页面引导用户去登录 */
    async register(payload) {
      return await apiRegister(payload)
    },

    /** 重新拉取用户信息（如资料页修改后同步） */
    async fetchUserInfo() {
      const res = await getUserInfo()
      this.userInfo = res.data
      localStorage.setItem('mall_user', JSON.stringify(this.userInfo))
    },

    /**
     * 登出：通知后端使 token 失效（删除 Redis 白名单），
     * 即使接口调用失败也清理本地登录态。
     */
    async logout() {
      try {
        await apiLogout()
      } catch (e) {
        // 忽略网络异常，本地清理照常进行
      }
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('mall_token')
      localStorage.removeItem('mall_user')
    }
  }
})

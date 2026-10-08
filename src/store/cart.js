import { defineStore } from 'pinia'
import { getCart, addToCart, updateCart, removeFromCart, clearCart, mergeCart } from '../api/cart'
import { useUserStore } from './user'

/**
 * 购物车状态（Pinia store）。
 *
 * 双模式设计（对应后端"登录合并"能力）：
 * - 已登录：数据在后端，items 为后端返回的 CartItemVO（cartId 为数字）；
 * - 未登录：数据存本地 localStorage（游客临时购物车），cartId 为 local_xxx 伪 ID，
 *   登录后由 Login.vue 调用 mergeLocal() 批量并入后端并清空本地。
 *
 * getter：totalCount（总件数）、totalPrice（总金额）供 Header 角标与结算栏使用。
 */
const LOCAL_KEY = 'mall_cart_local'

export const useCartStore = defineStore('cart', {
  state: () => ({
    /** 购物车明细（后端项或本地项） */
    items: [],
    /** 是否已完成首次加载（幂等标记） */
    loaded: false
  }),

  getters: {
    /** 总件数（数量求和） */
    totalCount: (state) => state.items.reduce((sum, it) => sum + (it.quantity || 0), 0),
    /** 总金额（单价 × 数量求和） */
    totalPrice: (state) =>
      state.items.reduce((sum, it) => sum + Number(it.price || 0) * (it.quantity || 0), 0)
  },

  actions: {
    /**
     * 初始化：Header 挂载时调用（幂等）。
     * 已登录拉后端购物车；未登录读取本地购物车。
     */
    async init() {
      if (this.loaded) return
      if (useUserStore().isLogin) {
        await this.fetchCart()
      } else {
        this.readLocal()
      }
    },

    /** 拉取后端购物车（已登录） */
    async fetchCart() {
      try {
        const res = await getCart()
        this.items = res.data.items || []
        this.loaded = true
      } catch (e) {
        // 401 已由拦截器处理（清登录态 + 跳登录页）；其余错误保持现状
      }
    },

    /** 从 localStorage 读取本地购物车（未登录） */
    readLocal() {
      try {
        this.items = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      } catch (e) {
        this.items = []
      }
      this.loaded = true
    },

    /** 把当前 items 写回 localStorage（未登录模式） */
    writeLocal() {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(this.items))
    },

    /** 本地购物车项的伪 ID（未登录时没有后端 cartId） */
    localId(productId, skuId) {
      return `local_${productId}_${skuId || 0}`
    },

    /**
     * 添加商品：已登录走后端（自动合并数量），未登录存本地。
     * @param payload { productId, skuId, quantity, productName, productImage, skuName, price, stock }
     */
    async addItem(payload) {
      if (useUserStore().isLogin) {
        await addToCart({
          productId: payload.productId,
          skuId: payload.skuId || 0,
          quantity: payload.quantity
        })
        await this.fetchCart()
      } else {
        const skuId = payload.skuId || 0
        const exist = this.items.find(
          (it) => it.productId === payload.productId && it.skuId === skuId
        )
        if (exist) {
          exist.quantity = Math.min(99, exist.quantity + payload.quantity)
        } else {
          this.items.push({
            cartId: this.localId(payload.productId, skuId),
            productId: payload.productId,
            skuId,
            quantity: payload.quantity,
            productName: payload.productName,
            productImage: payload.productImage,
            skuName: payload.skuName || '',
            price: payload.price || 0,
            stock: payload.stock ?? 99
          })
        }
        this.writeLocal()
      }
    },

    /** 更新数量 */
    async updateQuantity(cartId, quantity) {
      if (useUserStore().isLogin) {
        await updateCart(cartId, { quantity })
        await this.fetchCart()
      } else {
        const it = this.items.find((i) => i.cartId === cartId)
        if (it) {
          it.quantity = quantity
          this.writeLocal()
        }
      }
    },

    /** 删除单项 */
    async removeItem(cartId) {
      if (useUserStore().isLogin) {
        await removeFromCart(cartId)
        await this.fetchCart()
      } else {
        this.items = this.items.filter((i) => i.cartId !== cartId)
        this.writeLocal()
      }
    },

    /** 清空购物车（本地模式同时清 localStorage） */
    async clearCart() {
      if (useUserStore().isLogin) {
        await clearCart()
      }
      this.items = []
      if (!useUserStore().isLogin) {
        localStorage.removeItem(LOCAL_KEY)
      }
    },

    /** 重置为本地模式（登出后调用：清掉上一个用户的购物车数据） */
    resetToLocal() {
      this.items = []
      this.loaded = false
      this.readLocal()
    },

    /**
     * 登录合并：登录成功后调用。
     * 把 localStorage 中的游客购物车逐项提交后端，成功则清空本地，再拉取最新购物车。
     */
    async mergeLocal() {
      if (!useUserStore().isLogin) return
      let local = []
      try {
        local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      } catch (e) {
        local = []
      }
      if (local.length > 0) {
        await mergeCart(
          local.map((it) => ({
            productId: it.productId,
            skuId: it.skuId || 0,
            quantity: it.quantity
          }))
        )
        localStorage.removeItem(LOCAL_KEY)
      }
      await this.fetchCart()
    }
  }
})

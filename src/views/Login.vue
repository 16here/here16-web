<template>
  <!-- 用户登录页 -->
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <h2 class="title">登录商城</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <!-- 账号：支持用户名或手机号 -->
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="用户名或手机号" autocomplete="username" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            autocomplete="current-password"
            @keyup.enter="onSubmit"
          />
        </el-form-item>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">
          登 录
        </el-button>
      </el-form>

      <div class="footer">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { useCartStore } from '../store/cart'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  account: '',
  password: ''
})

/** 表单校验规则 */
const rules = {
  account: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

/** 提交登录 */
async function onSubmit() {
  // 前端校验不通过则不发起请求
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({ ...form })
    // 登录成功后把游客本地购物车合并到后端（失败不阻断登录）
    try {
      await cartStore.mergeLocal()
    } catch (e) {
      // 忽略合并失败，购物车数据仍保留在本地，下次登录再合并
    }
    ElMessage.success('登录成功')
    // 登录后跳回来源页（如被守卫拦截的页面），否则回首页
    router.push(route.query.redirect || '/')
  } catch (e) {
    // 错误提示已由 request 拦截器统一弹出
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding-top: 60px;
}

.auth-card {
  width: 400px;
}

.title {
  text-align: center;
  margin-bottom: 24px;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.footer {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.footer a {
  color: var(--mall-primary);
  text-decoration: none;
}
</style>

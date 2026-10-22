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

        <!-- 图形验证码（Phase 1：防爆破；点击图片可刷新） -->
        <el-form-item label="验证码" prop="captchaCode">
          <div class="captcha-row">
            <el-input
              v-model="form.captchaCode"
              placeholder="请输入验证码"
              maxlength="4"
              @keyup.enter="onSubmit"
            />
            <img
              v-if="captchaImage"
              :src="captchaImage"
              class="captcha-img"
              alt="验证码"
              title="点击刷新验证码"
              @click="loadCaptcha"
            />
          </div>
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
import { getCaptcha } from '../api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

const formRef = ref(null)
const loading = ref(false)

// 验证码（Phase 1）：captchaImage 为 Base64 图片，captchaId 提交时携带
const captchaImage = ref('')
const captchaId = ref('')

const form = reactive({
  account: '',
  password: '',
  captchaCode: ''
})

/** 表单校验规则 */
const rules = {
  account: [{ required: true, message: '请输入用户名或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

/** 加载图形验证码（进入页面即加载；登录失败/点击图片时刷新） */
async function loadCaptcha() {
  try {
    const res = await getCaptcha()
    captchaId.value = res.data.captchaId
    captchaImage.value = res.data.imageBase64
    form.captchaCode = ''
  } catch (e) {
    // 验证码拉取失败不阻断页面，登录时会再次提示
  }
}

/** 提交登录 */
async function onSubmit() {
  // 前端校验不通过则不发起请求
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login({ ...form, captchaId: captchaId.value })
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
    // 错误提示已由 request 拦截器统一弹出；验证码可能已失效，顺手刷新一张
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

// 页面挂载时拉取第一张验证码
loadCaptcha()
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

/* 验证码行：输入框 + 图片并排 */
.captcha-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.captcha-img {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  flex-shrink: 0;
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

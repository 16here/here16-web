<template>
  <!-- 管理员登录页 -->
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <h2 class="title">商城管理后台</h2>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="管理员账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入管理员账号" autocomplete="username" />
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

      <el-alert
        class="tip"
        type="info"
        :closable="false"
        title="阶段 5 说明：管理端认证复用用户登录接口；后端 /api/admin/** 已按 ADMIN 角色鉴权，普通用户即使登录也无法访问管理接口。请使用数据库 users 表中 role=ADMIN 的账号登录。"
      />
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminUserStore } from '../store/adminUser'
import { getCaptcha } from '../api/auth'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminUserStore()

const formRef = ref(null)
const loading = ref(false)

// 验证码（Phase 1）：captchaImage 为 Base64 图片，captchaId 提交时携带
const captchaImage = ref('')
const captchaId = ref('')

const form = reactive({
  username: '',
  password: '',
  captchaCode: ''
})

const rules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
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
    // 验证码拉取失败不阻断页面
  }
}

/** 提交管理员登录 */
async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await adminStore.login({ ...form, captchaId: captchaId.value })
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/')
  } catch (e) {
    // 登录失败（账号密码错误等）：拦截器已提示错误信息；刷新验证码
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

// 页面挂载时拉取第一张验证码
loadCaptcha()
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #409eff 0%, #1d6fb8 100%);
}

.login-card {
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

.tip {
  margin-top: 16px;
}
</style>

<template>
  <!-- 个人中心：查看与修改个人资料 -->
  <div class="profile">
    <el-card shadow="never">
      <template #header>
        <span>个人中心</span>
      </template>

      <!-- 基本信息（只读展示） -->
      <el-descriptions :column="2" border class="info">
        <el-descriptions-item label="用户 ID">{{ userStore.userInfo?.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ userStore.userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">
          {{ formatTime(userStore.userInfo?.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          {{ userStore.userInfo?.status === 1 ? '正常' : '禁用' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 编辑表单：邮箱 / 手机号 / 头像 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="edit-form">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="11 位手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="example@mail.com" />
        </el-form-item>

        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="form.avatar" placeholder="图片 URL（可选）" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave">保存修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const formRef = ref(null)
const saving = ref(false)

/** 编辑表单初始值来自 store 中的用户信息 */
const form = reactive({
  phone: userStore.userInfo?.phone || '',
  email: userStore.userInfo?.email || '',
  avatar: userStore.userInfo?.avatar || ''
})

const rules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

/** 保存修改：调用后端 /api/users/profile */
async function onSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const res = await request.put('/users/profile', {
      phone: form.phone || undefined,
      email: form.email || undefined,
      avatar: form.avatar || undefined
    })
    ElMessage.success('资料已更新')
    // 同步 store 与 localStorage，保证顶部导航等位置展示最新信息
    userStore.userInfo = res.data
    localStorage.setItem('mall_user', JSON.stringify(res.data))
  } catch (e) {
    // 错误提示已由拦截器统一弹出
  } finally {
    saving.value = false
  }
}

/** 重置表单为已保存的值 */
function resetForm() {
  form.phone = userStore.userInfo?.phone || ''
  form.email = userStore.userInfo?.email || ''
  form.avatar = userStore.userInfo?.avatar || ''
}

/** 时间格式化（后端返回 ISO 字符串） */
function formatTime(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}
</script>

<style scoped>
.profile {
  max-width: 720px;
  margin: 0 auto;
}

.info {
  margin-bottom: 24px;
}

.edit-form {
  margin-top: 8px;
}
</style>

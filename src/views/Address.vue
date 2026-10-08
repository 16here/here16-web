<template>
  <!-- 地址管理页（参考淘宝"收货地址"）：地址卡片 + 新增/编辑弹窗 -->
  <div class="page-container address-page">
    <div class="page-head">
      <h2>收货地址</h2>
      <el-button type="primary" @click="openCreate">新增地址</el-button>
    </div>

    <!-- 地址卡片列表 -->
    <div v-if="addresses.length > 0" class="addr-grid">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="addr-card"
        :class="{ default: addr.isDefault === 1 }"
      >
        <div class="card-top">
          <span class="name">{{ addr.receiverName }}</span>
          <span class="phone">{{ addr.receiverPhone }}</span>
          <el-tag v-if="addr.isDefault === 1" type="danger" size="small">默认</el-tag>
        </div>
        <p class="full-addr">{{ addr.fullAddress }}</p>
        <div class="card-ops">
          <el-button v-if="addr.isDefault !== 1" link type="primary" @click="onSetDefault(addr)">设为默认</el-button>
          <el-button link type="primary" @click="openEdit(addr)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(addr)">删除</el-button>
        </div>
      </div>
    </div>
    <el-empty v-else description="还没有收货地址，先添加一个吧">
      <el-button type="primary" @click="openCreate">新增地址</el-button>
    </el-empty>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑地址' : '新增地址'" width="520px">
      <AddressForm ref="addressFormRef" :address="editingAddress" @submit="onFormSubmit" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/address'
import AddressForm from '../components/AddressForm.vue'

const addresses = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const editingAddress = ref(null)
const submitting = ref(false)
const addressFormRef = ref(null)

/** 拉取地址列表 */
async function loadAddresses() {
  try {
    const res = await getAddresses()
    addresses.value = res.data || []
  } catch (e) {
    // 错误提示已由拦截器统一处理
  }
}

/** 新增：清空编辑态，打开弹窗 */
function openCreate() {
  editingId.value = null
  editingAddress.value = null
  dialogVisible.value = true
}

/** 编辑：回填地址对象 */
function openEdit(addr) {
  editingId.value = addr.id
  editingAddress.value = addr
  dialogVisible.value = true
}

/** 弹窗底部"保存"：让子表单校验并 emit 数据 */
async function onSubmit() {
  await addressFormRef.value.validateAndSubmit()
}

/** 子表单校验通过后回调（新增/编辑共用） */
async function onFormSubmit(dto) {
  submitting.value = true
  try {
    if (editingId.value) {
      await updateAddress(editingId.value, dto)
      ElMessage.success('地址已更新')
    } else {
      await createAddress(dto)
      ElMessage.success('地址已添加')
    }
    dialogVisible.value = false
    await loadAddresses()
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

/** 设为默认 */
async function onSetDefault(addr) {
  await setDefaultAddress(addr.id)
  ElMessage.success('已设为默认地址')
  await loadAddresses()
}

/** 删除（确认弹窗） */
async function onDelete(addr) {
  try {
    await ElMessageBox.confirm(`确定删除收货人「${addr.receiverName}」的地址吗？`, '删除确认', {
      type: 'warning'
    })
  } catch (e) {
    return
  }
  await deleteAddress(addr.id)
  ElMessage.success('已删除')
  await loadAddresses()
}

onMounted(loadAddresses)
</script>

<style scoped>
.address-page {
  min-height: 70vh;
  padding-top: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-head h2 {
  font-size: 20px;
  color: #333;
}

.addr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.addr-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
}

.addr-card.default {
  border-color: var(--mall-primary);
  box-shadow: 0 0 0 1px var(--mall-primary-light);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.card-top .name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.card-top .phone {
  font-size: 13px;
  color: #666;
}

.full-addr {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 12px;
  min-height: 40px;
}

.card-ops {
  display: flex;
  gap: 4px;
  border-top: 1px dashed #f0f0f0;
  padding-top: 10px;
}
</style>

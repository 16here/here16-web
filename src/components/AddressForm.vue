<template>
  <!-- 地址表单（新增 / 编辑共用）：省市区三级联动 + 姓名/电话/详细地址/默认开关 -->
  <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
    <el-form-item label="收货人" prop="receiverName">
      <el-input v-model="form.receiverName" placeholder="收货人姓名" maxlength="20" />
    </el-form-item>

    <el-form-item label="手机号" prop="receiverPhone">
      <el-input v-model="form.receiverPhone" placeholder="11 位手机号" maxlength="11" />
    </el-form-item>

    <!-- 省市区三级联动：省变化重置市/区，市变化重置区 -->
    <el-form-item label="所在地区" prop="province">
      <div class="area-row">
        <el-select v-model="form.province" placeholder="省" style="flex: 1" @change="onProvinceChange">
          <el-option v-for="p in AREAS" :key="p.name" :label="p.name" :value="p.name" />
        </el-select>
        <el-select v-model="form.city" placeholder="市" style="flex: 1" :disabled="!form.province" @change="onCityChange">
          <el-option v-for="c in cityList" :key="c.name" :label="c.name" :value="c.name" />
        </el-select>
        <el-select v-model="form.district" placeholder="区/县" style="flex: 1" :disabled="!form.city">
          <el-option v-for="d in districtList" :key="d" :label="d" :value="d" />
        </el-select>
      </div>
    </el-form-item>

    <el-form-item label="详细地址" prop="detail">
      <el-input v-model="form.detail" type="textarea" :rows="2" placeholder="街道、门牌号等" maxlength="120" />
    </el-form-item>

    <el-form-item label="默认地址">
      <el-switch v-model="form.isDefault" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { AREAS } from '../utils/areas'

/**
 * 地址表单组件（三级联动）。
 *
 * 用法：
 * - <AddressForm ref="formRef" :model="address" />，提交前调用 formRef.validate()；
 * - props.address 传入 null（新增）或一个地址对象（编辑，自动回填）。
 *
 * emit('submit', dto)：校验通过后由父组件提交（新增/编辑由父组件调接口）。
 */
const props = defineProps({
  /** 编辑时的地址对象；null 表示新增 */
  address: { type: Object, default: null }
})
const emit = defineEmits(['submit'])

const formRef = ref(null)

/** 表单模型（编辑时用 props.address 回填，区字段用 computed 拼接回显） */
const form = reactive({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

/** 校验规则 */
const rules = {
  receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  province: [{ required: true, message: '请选择省份', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, message: '请选择区/县', trigger: 'change' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

/** 当前省对应的市列表 */
const cityList = computed(() => AREAS.find((p) => p.name === form.province)?.cities || [])
/** 当前市对应的区列表 */
const districtList = computed(() => cityList.value.find((c) => c.name === form.city)?.districts || [])

/** 切换省份：清空市与区 */
function onProvinceChange() {
  form.city = ''
  form.district = ''
}

/** 切换城市：清空区 */
function onCityChange() {
  form.district = ''
}

// 编辑时回填：address 的 province/city/district 是独立字段，直接赋值
watch(
  () => props.address,
  (addr) => {
    form.receiverName = addr?.receiverName || ''
    form.receiverPhone = addr?.receiverPhone || ''
    form.province = addr?.province || ''
    form.city = addr?.city || ''
    form.district = addr?.district || ''
    form.detail = addr?.detail || ''
    form.isDefault = !!addr?.isDefault
  },
  { immediate: true }
)

/** 对外暴露：校验，通过后把数据 emit 给父组件（由父组件提交接口） */
async function validateAndSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    receiverName: form.receiverName,
    receiverPhone: form.receiverPhone,
    province: form.province,
    city: form.city,
    district: form.district,
    detail: form.detail,
    isDefault: form.isDefault
  })
}

defineExpose({ validateAndSubmit })
</script>

<style scoped>
.area-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>

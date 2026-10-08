<template>
  <!-- 规格选择弹窗：选择规格 + 数量，确认后回传 -->
  <el-dialog
    :model-value="modelValue"
    title="选择规格"
    width="420px"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <!-- 规格列表：单选 -->
    <div class="sku-group">
      <button
        v-for="sku in skus"
        :key="sku.id"
        type="button"
        class="sku-btn"
        :class="{ active: selected?.id === sku.id, disabled: sku.stock <= 0 }"
        :disabled="sku.stock <= 0"
        @click="selected = sku"
      >
        {{ sku.name }}
        <span v-if="sku.stock <= 0" class="sold-out">（无货）</span>
      </button>
      <p v-if="skus.length === 0" class="no-sku">该商品暂无规格</p>
    </div>

    <!-- 数量 -->
    <div class="quantity-row">
      <span class="label">数量：</span>
      <el-input-number v-model="quantity" :min="1" :max="maxQuantity" :disabled="!selected" />
    </div>

    <!-- 价格与库存反馈 -->
    <div v-if="selected" class="feedback">
      <span class="price">{{ selected.price.toFixed(2) }}</span>
      <span class="stock">库存 {{ selected.stock }}</span>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!selected || selected.stock <= 0" @click="onConfirm">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  /** 弹窗显隐（v-model） */
  modelValue: { type: Boolean, default: false },
  /** 规格列表（{id,name,price,stock,image}） */
  skus: { type: Array, default: () => [] },
  /** 默认选中的规格 ID（可选） */
  defaultSkuId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const selected = ref(null)
const quantity = ref(1)

/** 可购买数量上限 = 所选规格库存 */
const maxQuantity = computed(() => (selected.value ? Math.max(1, selected.value.stock) : 1))

// 弹窗打开时：重置选择状态
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selected.value =
        props.skus.find((s) => s.id === props.defaultSkuId) || props.skus.find((s) => s.stock > 0) || null
      quantity.value = 1
    }
  }
)

/** 确认选择 */
function onConfirm() {
  if (!selected.value) return
  emit('confirm', { sku: selected.value, quantity: quantity.value })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sku-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.sku-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.15s;
}

.sku-btn:hover {
  border-color: var(--mall-primary);
  color: var(--mall-primary);
}

.sku-btn.active {
  border-color: var(--mall-primary);
  background: var(--mall-primary-light);
  color: var(--mall-primary);
}

.sku-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
  background: #fafafa;
}

.sold-out {
  font-size: 12px;
}

.no-sku {
  color: #999;
  font-size: 13px;
}

.quantity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.label {
  font-size: 14px;
  color: #333;
}

.feedback {
  display: flex;
  gap: 16px;
  align-items: baseline;
  padding: 10px;
  background: var(--mall-primary-light);
  border-radius: 4px;
}

.feedback .price {
  font-size: 20px;
}

.feedback .stock {
  font-size: 13px;
  color: #666;
}
</style>

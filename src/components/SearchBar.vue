<template>
  <!-- 电商搜索框：输入 + 按钮 + 回车触发 -->
  <div class="search-bar">
    <el-input
      v-model="keyword"
      class="search-input"
      :placeholder="placeholder"
      clearable
      @keyup.enter="onSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <button class="search-btn" @click="onSearch">搜索</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  placeholder: { type: String, default: '搜索商品' },
  /** 初始关键词（父组件可传入已有搜索词） */
  initialKeyword: { type: String, default: '' }
})

const emit = defineEmits(['search'])

const keyword = ref(props.initialKeyword)

/** 触发搜索 */
function onSearch() {
  emit('search', keyword.value.trim())
}

/** 供父组件重置关键词（如切换分类时） */
function setKeyword(value) {
  keyword.value = value || ''
}

defineExpose({ setKeyword })
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 4px 0 0 4px;
  box-shadow: 0 0 0 2px var(--mall-primary) inset;
}

.search-btn {
  height: 32px;
  padding: 0 20px;
  border: none;
  border-radius: 0 4px 4px 0;
  background: var(--mall-primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.search-btn:hover {
  background: var(--mall-primary-dark);
}
</style>

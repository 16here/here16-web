<template>
  <!-- 管理端分类管理页：树形表格 + 新增子分类/编辑/删除 -->
  <div class="category-manage">
    <!-- ---------- 工具栏 ---------- -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreate(null)">新增顶级分类</el-button>
      <span class="total">共 {{ flatList.length }} 个分类</span>
    </div>

    <!-- ---------- 树形表格 ---------- -->
    <el-table
      v-loading="loading"
      :data="treeData"
      row-key="id"
      border
      :tree-props="{ children: 'children' }"
      default-expand-all
    >
      <el-table-column prop="name" label="分类名称" min-width="220" />
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="层级" width="90">
        <template #default="{ row }">
          <el-tag :type="row.parentId === 0 ? 'warning' : 'info'" size="small">
            {{ row.parentId === 0 ? '顶级' : '子级' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button link type="primary" @click="openCreate(row)">新增子分类</el-button>
          <el-button link type="warning" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ---------- 新增 / 编辑弹窗 ---------- -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父分类">
          <el-select
            v-model="form.parentId"
            placeholder="顶级分类（不选即顶级）"
            clearable
            style="width: 100%"
            :disabled="form.parentId === 0 && isEdit && form.originalId === 0"
          >
            <el-option v-for="c in flatList" :key="c.id" :label="c.label" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :step="1" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../api/category'

const list = ref([])
const loading = ref(false)

/** 平铺分类列表（带层级标签） */
const flatList = computed(() =>
  list.value.map((c) => {
    const parent = list.value.find((p) => p.id === c.parentId)
    return { ...c, label: c.parentId === 0 ? c.name : `${parent ? parent.name : ''}/${c.name}` }
  })
)

/** 前端平铺列表转树（后端公开接口返回树，管理端接口返回平铺，此处自转） */
function buildTree(flat) {
  const map = new Map()
  flat.forEach((item) => map.set(item.id, { ...item, children: [] }))
  const roots = []
  map.forEach((node) => {
    if (node.parentId === 0 || !map.has(node.parentId)) {
      roots.push(node)
    } else {
      map.get(node.parentId).children.push(node)
    }
  })
  // 按 sort 排序
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id)
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
}

const treeData = computed(() => buildTree(list.value))

/** ---------- 弹窗状态 ---------- */
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({ name: '', parentId: null, sort: 0 })

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑分类' : '新增分类'))

/** 新增：parent 为空则建顶级，否则建子分类 */
function openCreate(parent) {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.parentId = parent ? parent.id : null
  form.sort = 0
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.parentId = row.parentId === 0 ? null : row.parentId
  form.sort = row.sort
  dialogVisible.value = true
}

/** 提交保存 */
async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      name: form.name,
      parentId: form.parentId || 0,
      sort: form.sort || 0
    }
    if (isEdit.value) {
      await updateCategory(editId.value, payload)
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已创建')
    }
    dialogVisible.value = false
    loadList()
  } catch {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

/** 删除（后端会拒绝有子分类或商品的分类） */
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除分类「${row.name}」？`, '删除确认', { type: 'warning' })
    await deleteCategory(row.id)
    ElMessage.success('分类已删除')
    loadList()
  } catch (error) {
    // 用户取消则静默；其余失败由拦截器提示
  }
}

/** 加载分类列表 */
async function loadList() {
  loading.value = true
  try {
    const res = await getAdminCategories()
    list.value = res.data || []
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

onMounted(loadList)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.total {
  margin-left: auto;
  font-size: 13px;
  color: #999;
}
</style>

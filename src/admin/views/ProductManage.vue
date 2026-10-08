<template>
  <!-- 管理端商品管理页：搜索/筛选 → 商品表格 → 新增/编辑弹窗 → 上下架/删除 -->
  <div class="product-manage">
    <!-- ---------- 工具栏 ---------- -->
    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索名称 / SKU"
        clearable
        style="width: 200px"
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-select
        v-model="query.categoryId"
        placeholder="全部分类"
        clearable
        style="width: 180px"
        @change="reload"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.label" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="openCreate">新增商品</el-button>
      <span class="total">共 {{ total }} 件商品</span>
    </div>

    <!-- ---------- 商品表格 ---------- -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="主图" width="72">
        <template #default="{ row }">
          <el-image
            v-if="row.cover"
            :src="row.cover"
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 4px"
            :preview-src-list="[row.cover]"
            preview-teleported
          >
            <template #error>
              <div class="img-fallback">无图</div>
            </template>
          </el-image>
          <div v-else class="img-fallback">无图</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sku" label="SKU" width="110" />
      <el-table-column label="价格" width="90">
        <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column prop="categoryName" label="分类" width="110" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ---------- 分页 ---------- -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="query.pageSize"
        :current-page="query.page"
        @current-change="onPageChange"
      />
    </div>

    <!-- ---------- 新增 / 编辑弹窗 ---------- -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '新增商品'" width="760px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="SKU 编码" prop="sku">
              <el-input v-model="form.sku" placeholder="如 DR-001（唯一）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.label" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="商品描述">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品详情描述（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上架状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 商品图片 -->
        <el-form-item label="商品图片">
          <div class="img-list">
            <div v-for="(img, index) in form.images" :key="index" class="img-row">
              <el-input v-model="form.images[index]" placeholder="图片地址 http(s)://…" />
              <el-button link type="danger" @click="form.images.splice(index, 1)">删除</el-button>
            </div>
            <el-button type="dashed" @click="form.images.push('')">+ 添加图片</el-button>
          </div>
        </el-form-item>

        <!-- 商品规格 -->
        <el-form-item label="商品规格">
          <div class="sku-list">
            <div v-for="(sku, index) in form.skus" :key="index" class="sku-row">
              <el-input v-model="sku.name" placeholder="规格名，如 红色 / M" style="width: 150px" />
              <el-input-number v-model="sku.price" :min="0" :precision="2" placeholder="价格" style="width: 130px" />
              <el-input-number v-model="sku.stock" :min="0" placeholder="库存" style="width: 130px" />
              <el-input v-model="sku.image" placeholder="规格图（可选）" style="width: 200px" />
              <el-button link type="danger" @click="form.skus.splice(index, 1)">删除</el-button>
            </div>
            <el-button type="dashed" @click="addSku">+ 添加规格</el-button>
          </div>
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
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus
} from '../api/product'
import { getAdminCategories } from '../api/category'

/** ---------- 列表状态 ---------- */
const list = ref([])
const total = ref(0)
const loading = ref(false)
const categories = ref([])

/** 查询条件（与后端 ProductQueryDTO 字段对齐） */
const query = reactive({
  keyword: '',
  categoryId: null,
  page: 1,
  pageSize: 10
})

/** ---------- 弹窗状态 ---------- */
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

/** 表单默认值 */
const emptyForm = () => ({
  sku: '',
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: null,
  status: 1,
  images: [],
  skus: []
})

const form = reactive(emptyForm())

/** 表单校验规则 */
const rules = {
  sku: [{ required: true, message: '请输入 SKU 编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'change' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

/** 加载分类下拉（平铺 + 层级标签） */
async function loadCategories() {
  try {
    const res = await getAdminCategories()
    // 平铺列表：为每个分类生成"父级/子级"展示标签
    const flat = res.data || []
    categories.value = flat.map((c) => {
      const parent = flat.find((p) => p.id === c.parentId)
      return { id: c.id, label: c.parentId === 0 ? c.name : `${parent ? parent.name : ''}/${c.name}` }
    })
  } catch {
    // 分类加载失败不阻塞列表
  }
}

/** 加载商品列表 */
async function loadList() {
  loading.value = true
  try {
    const res = await getAdminProducts({
      keyword: query.keyword || undefined,
      categoryId: query.categoryId || undefined,
      page: query.page,
      pageSize: query.pageSize
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 刷新列表（回到第一页） */
function reload() {
  query.page = 1
  loadList()
}

/** 翻页 */
function onPageChange(page) {
  query.page = page
  loadList()
}

/** ---------- 新增 / 编辑 ---------- */
function openCreate() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    stock: row.stock,
    categoryId: row.categoryId,
    status: row.status,
    images: [],
    skus: []
  })
  dialogVisible.value = true
}

/** 添加空规格行 */
function addSku() {
  form.skus.push({ name: '', price: 0, stock: 0, image: '' })
}

/** 提交保存 */
async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    // 过滤空图片地址与空规格行
    const payload = {
      ...form,
      images: form.images.filter((url) => url && url.trim()),
      skus: form.skus.filter((s) => s.name && s.name.trim())
    }
    if (isEdit.value) {
      await updateProduct(editId.value, payload)
      ElMessage.success('商品已更新')
    } else {
      await createProduct(payload)
      ElMessage.success('商品已创建')
    }
    dialogVisible.value = false
    reload()
  } catch {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

/** ---------- 上下架 / 删除 ---------- */
async function toggleStatus(row) {
  const target = row.status === 1 ? 0 : 1
  try {
    await updateProductStatus(row.id, target)
    ElMessage.success(target === 1 ? '已上架' : '已下架')
    loadList()
  } catch {
    // 拦截器已提示
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除商品「${row.name}」？删除后不可恢复。`, '删除确认', {
      type: 'warning'
    })
    await deleteProduct(row.id)
    ElMessage.success('商品已删除')
    reload()
  } catch (error) {
    if (error !== 'cancel') {
      // 仅确认被取消时静默，其他失败由拦截器提示
    }
  }
}

onMounted(() => {
  loadCategories()
  loadList()
})
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.img-fallback {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #bbb;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片动态行 */
.img-list,
.sku-list {
  width: 100%;
}

.img-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.sku-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
</style>

<template>
  <!-- 管理端营销活动管理（阶段 8）：满减 / 折扣 / 秒杀三类活动的增删改 + 启停 -->
  <div class="promotion-manage">
    <!-- ---------- 工具栏 ---------- -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增活动</el-button>
      <span class="total">共 {{ total }} 个活动</span>
      <span class="tip">提示：同一时段满减/折扣取优惠最大一个且不叠加；秒杀按商品规格精确匹配</span>
    </div>

    <!-- ---------- 活动表格 ---------- -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="name" label="活动名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'danger' : row.type === 2 ? 'warning' : 'success'" size="small">
            {{ row.typeText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="规则" min-width="220">
        <template #default="{ row }">
          <template v-if="row.type === 1">
            满 {{ Number(row.threshold).toFixed(0) }} 元减 {{ Number(row.amount).toFixed(2) }} 元
          </template>
          <template v-else-if="row.type === 2">
            {{ (Number(row.discountRate) * 10).toFixed(1).replace('.0', '') }} 折
          </template>
          <template v-else>
            <div v-for="r in row.ruleItems" :key="r.productId + '-' + (r.skuId || 0)" class="rule-line">
              商品#{{ r.productId }}{{ r.skuId ? ` / SKU#${r.skuId}` : '' }} → ¥{{ Number(r.price).toFixed(2) }}
            </div>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="活动时间" width="200">
        <template #default="{ row }">
          {{ String(row.startTime || '').slice(0, 16) }}<br />~ {{ String(row.endTime || '').slice(0, 16) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'info' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑活动' : '新增活动'" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="如：618 全场满减 / 限时秒杀" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-radio-group v-model="form.type" @change="onTypeChange">
            <el-radio :value="1">满减</el-radio>
            <el-radio :value="2">折扣</el-radio>
            <el-radio :value="3">秒杀</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 满减规则 -->
        <template v-if="form.type === 1">
          <el-form-item label="满减门槛" prop="threshold">
            <el-input-number v-model="form.threshold" :min="0.01" :precision="2" :step="50" style="width: 200px" />
            <span class="form-tip">订单金额 ≥ 门槛生效</span>
          </el-form-item>
          <el-form-item label="减免金额" prop="amount">
            <el-input-number v-model="form.amount" :min="0.01" :precision="2" :step="10" style="width: 200px" />
          </el-form-item>
        </template>

        <!-- 折扣规则 -->
        <el-form-item v-else-if="form.type === 2" label="折扣率" prop="discountRate">
          <el-input-number v-model="form.discountRate" :min="0.01" :max="0.99" :precision="2" :step="0.05" style="width: 200px" />
          <span class="form-tip">0.85 = 8.5 折（实付 = 金额 × 折扣率）</span>
        </el-form-item>

        <!-- 秒杀规则：商品 + 规格（可选）+ 秒杀价 动态行 -->
        <el-form-item v-else label="秒杀规则" required>
          <div class="rules">
            <div v-for="(r, i) in form.rules" :key="i" class="rule-row">
              <el-select v-model="r.productId" placeholder="选择商品" filterable style="width: 170px" @change="onRuleProductChange(r)">
                <el-option v-for="p in products" :key="p.id" :label="`${p.name} (ID:${p.id})`" :value="p.id" />
              </el-select>
              <el-input-number v-model="r.skuId" placeholder="SKU ID(可选)" :min="0" :step="1" controls-position="right" style="width: 130px" />
              <el-input-number v-model="r.price" :min="0.01" :precision="2" :step="10" placeholder="秒杀价" style="width: 120px" />
              <el-button link type="danger" :disabled="form.rules.length <= 1" @click="removeRule(i)">删除</el-button>
            </div>
            <el-button link type="primary" @click="addRule">+ 添加规则</el-button>
          </div>
        </el-form-item>

        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminPromotions, createPromotion, updatePromotion, deletePromotion, updatePromotionStatus } from '../api/promotion'
import { getAdminProducts } from '../api/product'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

// 秒杀规则用到的商品与规格下拉数据
const products = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const timeRange = ref(null)

const form = reactive({
  id: null,
  name: '',
  type: 1,
  threshold: null,
  amount: null,
  discountRate: null,
  rules: [],
  startTime: null,
  endTime: null,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }]
}

/** 拉取活动列表 */
async function load() {
  loading.value = true
  try {
    const res = await getAdminPromotions({ page: query.page, pageSize: query.pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 拉取商品列表（秒杀规则下拉用；只需部分商品即可选择） */
async function loadProducts() {
  try {
    const res = await getAdminProducts({ page: 1, pageSize: 100 })
    products.value = res.data?.list || []
  } catch (e) {
    // 拦截器已提示
  }
}

function onPageChange(p) {
  query.page = p
  load()
}

/** 选择商品后清空 SKU（避免 SKU 不属于该商品） */
function onRuleProductChange(r) {
  r.skuId = null
}

function addRule() {
  form.rules.push({ productId: null, skuId: null, price: null })
}

function removeRule(i) {
  form.rules.splice(i, 1)
}

/** 打开新增弹窗 */
function openCreate() {
  isEdit.value = false
  Object.assign(form, {
    id: null, name: '', type: 1, threshold: null, amount: null,
    discountRate: null, rules: [{ productId: null, skuId: null, price: null }],
    startTime: null, endTime: null, status: 1
  })
  timeRange.value = null
  dialogVisible.value = true
}

/** 打开编辑弹窗（回填；秒杀规则对象结构 {productId, skuId, price} 与后端一致） */
function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id, name: row.name, type: row.type,
    threshold: row.threshold != null ? Number(row.threshold) : null,
    amount: row.amount != null ? Number(row.amount) : null,
    discountRate: row.discountRate != null ? Number(row.discountRate) : null,
    rules: (row.ruleItems || []).map((r) => ({
      productId: r.productId, skuId: r.skuId ?? null, price: Number(r.price)
    })),
    startTime: row.startTime, endTime: row.endTime, status: row.status
  })
  if (form.rules.length === 0) form.rules = [{ productId: null, skuId: null, price: null }]
  timeRange.value = row.startTime && row.endTime ? [new Date(row.startTime), new Date(row.endTime)] : null
  dialogVisible.value = true
}

/** 类型切换：清空其他类型的字段 */
function onTypeChange() {
  if (form.type === 1) {
    form.amount = form.amount ?? null
  } else if (form.type === 2) {
    form.discountRate = form.discountRate ?? null
  } else {
    if (form.rules.length === 0) form.rules = [{ productId: null, skuId: null, price: null }]
  }
}

/** 保存（新增 / 编辑；按类型做必填联动校验） */
async function onSave() {
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择活动时间')
    return
  }
  form.startTime = formatDate(timeRange.value[0])
  form.endTime = formatDate(timeRange.value[1])
  if (form.type === 1 && (form.threshold == null || form.amount == null)) {
    ElMessage.warning('满减活动必须填写门槛与减免金额')
    return
  }
  if (form.type === 2 && form.discountRate == null) {
    ElMessage.warning('折扣活动必须填写折扣率')
    return
  }
  if (form.type === 3) {
    const bad = form.rules.find((r) => !r.productId || r.price == null)
    if (bad) {
      ElMessage.warning('每条秒杀规则都必须选择商品并填写秒杀价')
      return
    }
    // SKU 未填（0/空）视为商品级兜底规则
    form.rules.forEach((r) => {
      if (!r.skuId) r.skuId = null
    })
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updatePromotion(form.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await createPromotion({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

/** 启用 / 停用 */
async function toggleStatus(row) {
  try {
    await updatePromotionStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success(row.status === 1 ? '已停用' : '已启用')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 删除活动 */
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除活动「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await deletePromotion(row.id)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** LocalDateTime 字符串 */
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

onMounted(() => {
  load()
  loadProducts()
})
</script>

<style scoped>
.promotion-manage {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.total {
  font-size: 13px;
  color: #999;
}

.tip {
  font-size: 12px;
  color: #bbb;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}

.rule-line {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.rules {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

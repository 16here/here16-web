<template>
  <!-- 管理端优惠券管理（阶段 8）：模板列表 → 新增/编辑弹窗 → 上下架 → 定向发放 -->
  <div class="coupon-manage">
    <!-- ---------- 工具栏 ---------- -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增优惠券</el-button>
      <span class="total">共 {{ total }} 张券模板</span>
    </div>

    <!-- ---------- 模板表格 ---------- -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="name" label="券名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'danger' : 'warning'" size="small">{{ row.typeText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="门槛" width="90">
        <template #default="{ row }">
          {{ Number(row.threshold || 0) > 0 ? `满${Number(row.threshold).toFixed(0)}元` : '无门槛' }}
        </template>
      </el-table-column>
      <el-table-column label="优惠" width="100">
        <template #default="{ row }">
          <template v-if="row.type === 1">减 ¥{{ Number(row.amount).toFixed(2) }}</template>
          <template v-else>{{ (Number(row.discountRate) * 10).toFixed(1).replace('.0', '') }}折</template>
        </template>
      </el-table-column>
      <el-table-column label="总量/已领" width="110">
        <template #default="{ row }">
          {{ row.totalQuantity === 0 ? '不限' : row.totalQuantity }} / {{ row.receivedCount || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="perUserLimit" label="限领" width="70" />
      <el-table-column label="有效期" width="200">
        <template #default="{ row }">
          {{ String(row.validFrom || '').slice(0, 10) }} ~ {{ String(row.validUntil || '').slice(0, 10) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="warning" @click="openIssue(row)">发放</el-button>
          <el-button link :type="row.status === 1 ? 'info' : 'success'" @click="toggleStatus(row)">
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑优惠券' : '新增优惠券'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="券名称" prop="name">
          <el-input v-model="form.name" placeholder="如：满100减20券 / 全场9折券" />
        </el-form-item>
        <el-form-item label="券类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">满减券</el-radio>
            <el-radio :value="2">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="使用门槛" prop="threshold">
          <el-input-number v-model="form.threshold" :min="0" :precision="2" :step="10" style="width: 200px" />
          <span class="form-tip">满 X 元可用，0 = 无门槛</span>
        </el-form-item>
        <el-form-item v-if="form.type === 1" label="减免金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" :step="5" style="width: 200px" />
          <span class="form-tip">实付 = 订单金额 - 减免金额</span>
        </el-form-item>
        <el-form-item v-else label="折扣率" prop="discountRate">
          <el-input-number v-model="form.discountRate" :min="0.01" :max="0.99" :precision="2" :step="0.05" style="width: 200px" />
          <span class="form-tip">0.90 = 9 折（实付 = 金额 × 折扣率）</span>
        </el-form-item>
        <el-form-item label="发行总量" prop="totalQuantity">
          <el-input-number v-model="form.totalQuantity" :min="0" :step="10" style="width: 200px" />
          <span class="form-tip">0 = 不限量</span>
        </el-form-item>
        <el-form-item label="每人限领" prop="perUserLimit">
          <el-input-number v-model="form.perUserLimit" :min="1" :step="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="有效期" prop="validRange">
          <el-date-picker
            v-model="validRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- ---------- 定向发放弹窗 ---------- -->
    <el-dialog v-model="issueVisible" title="定向发放优惠券" width="420px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="券名称">
          <span>{{ issueTarget?.name }}</span>
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="issueForm.phone" placeholder="用户注册手机号（用户不存在将提示）" maxlength="11" />
        </el-form-item>
        <el-form-item label="发放数量" required>
          <el-input-number v-model="issueForm.quantity" :min="1" :max="100" :step="1" style="width: 160px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" :loading="issuing" @click="onIssue">确认发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon, issueCoupon } from '../api/coupon'

const loading = ref(false)
const saving = ref(false)
const issuing = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const validRange = ref(null)

/** 表单默认值（类型联动：满减券与折扣券各自必填项不同） */
const form = reactive({
  id: null,
  name: '',
  type: 1,
  threshold: 0,
  amount: null,
  discountRate: null,
  totalQuantity: 0,
  perUserLimit: 1,
  status: 1,
  validFrom: null,
  validUntil: null
})

/** 表单校验规则 */
const rules = {
  name: [{ required: true, message: '请输入券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择券类型', trigger: 'change' }],
  threshold: [{ required: true, message: '请设置门槛', trigger: 'blur' }]
}

// ---------- 发放 ----------
const issueVisible = ref(false)
const issueTarget = ref(null)
const issueForm = reactive({ phone: '', quantity: 1 })

/** 拉取模板列表 */
async function load() {
  loading.value = true
  try {
    const res = await getAdminCoupons({ page: query.page, pageSize: query.pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  query.page = p
  load()
}

/** 打开新增弹窗 */
function openCreate() {
  isEdit.value = false
  Object.assign(form, {
    id: null, name: '', type: 1, threshold: 0, amount: null, discountRate: null,
    totalQuantity: 0, perUserLimit: 1, status: 1, validFrom: null, validUntil: null
  })
  validRange.value = null
  dialogVisible.value = true
}

/** 打开编辑弹窗（回填） */
function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id, name: row.name, type: row.type, threshold: Number(row.threshold || 0),
    amount: row.amount != null ? Number(row.amount) : null,
    discountRate: row.discountRate != null ? Number(row.discountRate) : null,
    totalQuantity: row.totalQuantity ?? 0, perUserLimit: row.perUserLimit ?? 1,
    status: row.status, validFrom: row.validFrom, validUntil: row.validUntil
  })
  validRange.value = row.validFrom && row.validUntil ? [new Date(row.validFrom), new Date(row.validUntil)] : null
  dialogVisible.value = true
}

/** 保存（新增 / 编辑） */
async function onSave() {
  // 有效期联动：表单校验外再检查一次
  if (!validRange.value || validRange.value.length !== 2) {
    ElMessage.warning('请选择有效期')
    return
  }
  form.validFrom = formatDate(validRange.value[0])
  form.validUntil = formatDate(validRange.value[1])
  // 类型联动：满减券必须填金额、折扣券必须填折扣率
  if (form.type === 1 && form.amount == null) {
    ElMessage.warning('满减券必须填写减免金额')
    return
  }
  if (form.type === 2 && form.discountRate == null) {
    ElMessage.warning('折扣券必须填写折扣率')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateCoupon(form.id, { ...form })
      ElMessage.success('更新成功')
    } else {
      await createCoupon({ ...form })
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

/** 上下架 */
async function toggleStatus(row) {
  try {
    await updateCoupon(row.id, {
      name: row.name, type: row.type, threshold: row.threshold,
      amount: row.amount, discountRate: row.discountRate,
      totalQuantity: row.totalQuantity, perUserLimit: row.perUserLimit,
      status: row.status === 1 ? 0 : 1, validFrom: row.validFrom, validUntil: row.validUntil
    })
    ElMessage.success(row.status === 1 ? '已下架' : '已上架')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 删除（确认后删除；已领取的券模板不可删除，后端会拦截） */
async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除优惠券「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await deleteCoupon(row.id)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

/** 打开发放弹窗 */
function openIssue(row) {
  issueTarget.value = row
  issueForm.phone = ''
  issueForm.quantity = 1
  issueVisible.value = true
}

/** 定向发放：按手机号发券 */
async function onIssue() {
  if (!/^1\d{10}$/.test(issueForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  issuing.value = true
  try {
    const res = await issueCoupon(issueTarget.value.id, issueForm.phone, issueForm.quantity)
    ElMessage.success(`已发放 ${res.data.issued} 张`)
    issueVisible.value = false
    load()
  } catch (e) {
    // 拦截器已提示（如用户不存在）
  } finally {
    issuing.value = false
  }
}

/** LocalDateTime 字符串（后端接收 yyyy-MM-ddTHH:mm:ss） */
function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

onMounted(load)
</script>

<style scoped>
.coupon-manage {
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
</style>

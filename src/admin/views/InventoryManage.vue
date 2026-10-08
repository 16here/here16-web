<template>
  <!-- 管理端库存管理页（阶段 6）：
       库存列表（SKU 逐行 + 无规格商品一行）→ 调整库存弹窗 → 库存流水抽屉 -->
  <div class="inventory-manage">
    <!-- ---------- 工具栏 ---------- -->
    <div class="toolbar">
      <h3 class="title">库存管理</h3>
      <span class="tip">可卖库存 = 总库存 - 锁定库存（下单未支付预占）</span>
    </div>

    <!-- ---------- 库存表格 ---------- -->
    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="productName" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="productSku" label="商品SKU" width="110" />
      <el-table-column label="规格" width="90">
        <template #default="{ row }">
          <span v-if="row.skuId > 0">{{ row.skuName }}</span>
          <el-tag v-else size="small" type="info">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="售价" width="90">
        <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="总库存" width="90">
        <template #default="{ row }">
          <b>{{ row.stock }}</b>
        </template>
      </el-table-column>
      <el-table-column label="锁定库存" width="100">
        <template #default="{ row }">
          <span :class="{ 'locked-high': row.lockedStock > 0 }">{{ row.lockedStock }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可卖库存" width="100">
        <template #default="{ row }">
          <b :class="{ 'stock-low': row.available <= 10 }">{{ row.available }}</b>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAdjust(row)">调整库存</el-button>
          <el-button link type="warning" @click="openLogs(row)">流水</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ---------- 调整库存弹窗 ---------- -->
    <el-dialog v-model="adjustVisible" :title="`调整库存 - ${adjustTarget?.productName || ''}`" width="460px">
      <el-form label-width="90px">
        <el-form-item label="规格">
          <span>{{ adjustTarget?.skuId > 0 ? adjustTarget?.skuName : '默认（商品级）' }}</span>
        </el-form-item>
        <el-form-item label="当前可卖">
          <span>{{ adjustTarget?.available }}</span>
        </el-form-item>
        <el-form-item label="调整数量" required>
          <el-input-number v-model="adjustForm.delta" :min="-99999" :max="99999" :step="10" />
          <div class="form-tip">正数 = 补货，负数 = 减库存（减后不可为负）</div>
        </el-form-item>
        <el-form-item label="调整原因" required>
          <el-input
            v-model="adjustForm.remark"
            type="textarea"
            :rows="2"
            maxlength="100"
            show-word-limit
            placeholder="如：大促补货 / 盘点修正"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <!-- ---------- 库存流水抽屉 ---------- -->
    <el-drawer v-model="logVisible" :title="`库存流水 - ${logTarget?.productName || ''} ${logTarget?.skuId > 0 ? '(' + logTarget?.skuName + ')' : '(默认)'}`" size="640px">
      <el-table v-loading="logLoading" :data="logs" border stripe size="small">
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="logTypeTag(row.type)" size="small">{{ row.typeText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="80">
          <template #default="{ row }">
            <span :class="{ 'qty-plus': row.changeQty > 0, 'qty-minus': row.changeQty < 0 }">
              {{ row.changeQty > 0 ? '+' : '' }}{{ row.changeQty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="订单号" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.orderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作方" width="80">
          <template #default="{ row }">{{ row.operatorText || '-' }}</template>
        </el-table-column>
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          small
          layout="prev, pager, next, total"
          :total="logTotal"
          :page-size="logQuery.pageSize"
          :current-page="logQuery.page"
          @current-change="onLogPageChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getInventorySkus, adjustStock, getStockLogs } from '../api/inventory'

const loading = ref(false)
const list = ref([])

/** 调整库存弹窗 */
const adjustVisible = ref(false)
const adjustTarget = ref(null)
const adjustForm = ref({ delta: 10, remark: '' })
const submitting = ref(false)

/** 流水抽屉 */
const logVisible = ref(false)
const logTarget = ref(null)
const logLoading = ref(false)
const logs = ref([])
const logTotal = ref(0)
const logQuery = ref({ skuId: 0, productId: 0, page: 1, pageSize: 10 })

/** 加载库存列表 */
async function loadList() {
  loading.value = true
  try {
    const res = await getInventorySkus()
    list.value = res.data || []
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    loading.value = false
  }
}

/** 打开调整库存弹窗 */
function openAdjust(row) {
  adjustTarget.value = row
  adjustForm.value = { delta: 10, remark: '' }
  adjustVisible.value = true
}

/** 提交调整 */
async function submitAdjust() {
  if (!adjustForm.value.delta || adjustForm.value.delta === 0) {
    ElMessage.warning('调整数量不能为 0')
    return
  }
  if (!adjustForm.value.remark?.trim()) {
    ElMessage.warning('请填写调整原因')
    return
  }
  submitting.value = true
  try {
    await adjustStock({
      skuId: adjustTarget.value.skuId,
      productId: adjustTarget.value.productId,
      delta: adjustForm.value.delta,
      remark: adjustForm.value.remark.trim()
    })
    ElMessage.success('库存调整成功')
    adjustVisible.value = false
    loadList()
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    submitting.value = false
  }
}

/** 打开流水抽屉 */
function openLogs(row) {
  logTarget.value = row
  logQuery.value = { skuId: row.skuId, productId: row.productId, page: 1, pageSize: 10 }
  loadLogs()
  logVisible.value = true
}

/** 加载流水 */
async function loadLogs() {
  logLoading.value = true
  try {
    const res = await getStockLogs({
      skuId: logQuery.value.skuId,
      productId: logQuery.value.productId,
      page: logQuery.value.page,
      pageSize: logQuery.value.pageSize
    })
    logs.value = res.data.list || []
    logTotal.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已统一提示
  } finally {
    logLoading.value = false
  }
}

/** 流水分页 */
function onLogPageChange(page) {
  logQuery.value.page = page
  loadLogs()
}

/** 流水类型标签颜色 */
function logTypeTag(type) {
  return {
    LOCK: 'warning',
    DEDUCT: 'danger',
    RELEASE: 'success',
    ADJUST: 'primary'
  }[type] || 'info'
}

/** 时间格式化（后端返回 ISO 字符串） */
function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

onMounted(loadList)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 14px;
}

.toolbar .title {
  font-size: 18px;
  color: #333;
}

.toolbar .tip {
  font-size: 12px;
  color: #999;
}

.locked-high {
  color: var(--el-color-warning, #e6a23c);
  font-weight: 600;
}

.stock-low {
  color: var(--el-color-danger, #f56c6c);
}

.qty-plus {
  color: var(--el-color-success, #67c23a);
  font-weight: 600;
}

.qty-minus {
  color: var(--el-color-danger, #f56c6c);
  font-weight: 600;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>

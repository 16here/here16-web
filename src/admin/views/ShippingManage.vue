<template>
  <!-- 管理端物流管理（阶段 9）：运单列表 + 状态筛选 + 详情抽屉（轨迹时间轴）+ 手动同步 -->
  <div class="shipping-manage">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="onSearch">
        <el-option label="已发货" :value="0" />
        <el-option label="运输中" :value="1" />
        <el-option label="已签收" :value="2" />
      </el-select>
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <!-- 运单表格 -->
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="运单ID" width="80" />
      <el-table-column prop="orderNo" label="订单号" width="230" />
      <el-table-column prop="shippingCompany" label="快递公司" width="110" />
      <el-table-column prop="trackingNo" label="快递单号" width="180" />
      <el-table-column label="物流状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 2 ? 'success' : row.status === 1 ? 'warning' : 'info'">
            {{ row.statusText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收货人" width="140">
        <template #default="{ row }">
          {{ row.receiverName }}（{{ row.receiverPhone }}）
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="发货时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">轨迹</el-button>
          <el-button
            v-if="row.status !== 2"
            link
            type="warning"
            :loading="syncingId === row.id"
            @click="onSync(row)"
          >
            同步轨迹
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadList"
      />
    </div>

    <!-- 运单详情抽屉（轨迹时间轴） -->
    <el-drawer v-model="drawerVisible" size="480px" title="物流轨迹">
      <template v-if="detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="快递公司">{{ detail.shippingCompany }}</el-descriptions-item>
          <el-descriptions-item label="快递单号">{{ detail.trackingNo }}</el-descriptions-item>
          <el-descriptions-item label="物流状态">
            <el-tag :type="detail.status === 2 ? 'success' : detail.status === 1 ? 'warning' : 'info'">
              {{ detail.statusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">
            {{ detail.receiverName }}（{{ detail.receiverPhone }}）
          </el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ detail.receiverAddress }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="items-title">轨迹明细</h4>
        <el-timeline v-if="detail.traces && detail.traces.length">
          <el-timeline-item
            v-for="t in [...detail.traces].reverse()"
            :key="t.id"
            :timestamp="formatTime(t.trackTime)"
            placement="top"
            :type="t.id === detail.traces[detail.traces.length - 1].id ? 'success' : 'primary'"
          >
            <p class="trace-line">{{ t.trackInfo }}</p>
            <p v-if="t.location" class="trace-loc">{{ t.location }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无轨迹" :image-size="80" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getShippingList, getShippingDetail, syncShippingTrace } from '../api/shipping'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const syncingId = ref(null)
const drawerVisible = ref(false)
const detail = ref(null)

/** 查询条件 */
const query = reactive({
  status: null,
  page: 1,
  pageSize: 10
})

function formatTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ')
}

/** 加载运单列表 */
async function loadList() {
  loading.value = true
  try {
    const params = { page: query.page, pageSize: query.pageSize }
    if (query.status !== null && query.status !== '') params.status = query.status
    const res = await getShippingList(params)
    list.value = res.data.list || []
    total.value = Number(res.data.total || 0)
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 查询按钮：回到第一页 */
function onSearch() {
  query.page = 1
  loadList()
}

/** 打开轨迹抽屉 */
async function openDetail(row) {
  try {
    const res = await getShippingDetail(row.id)
    detail.value = res.data
    drawerVisible.value = true
  } catch (e) {
    // 拦截器已提示
  }
}

/** 手动同步轨迹（未签收运单 → 拉取最新轨迹并推进状态） */
async function onSync(row) {
  syncingId.value = row.id
  try {
    await syncShippingTrace(row.id)
    ElMessage.success('轨迹已同步')
    await loadList()
  } catch (e) {
    // 拦截器已提示
  } finally {
    syncingId.value = null
  }
}

onMounted(loadList)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.items-title {
  margin: 18px 0 12px;
  font-size: 14px;
  color: #333;
}
.trace-line {
  margin: 0;
  font-size: 13px;
  color: #444;
}
.trace-loc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #999;
}
</style>

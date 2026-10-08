<template>
  <!-- 管理端推荐系统管理（阶段 10）：
       ① 推荐效果统计卡片（Dashboard 顶部统计：总行为/今日/四类行为）
       ② 推荐位配置（热更新：写 Redis + 清缓存，无需重启立即生效）
       ③ 热门商品管理（近 N 天每个商品的行为构成明细） -->
  <div class="recommend-manage">
    <!-- ---------- ① 推荐效果统计卡片 ---------- -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-num">{{ stats.totalBehaviors ?? 0 }}</div>
        <div class="stat-label">近 {{ stats.hotDays ?? 7 }} 天行为总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.todayBehaviors ?? 0 }}</div>
        <div class="stat-label">今日行为数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-hot">{{ stats.viewCount ?? 0 }}</div>
        <div class="stat-label">浏览（权重1）</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-hot">{{ stats.cartCount ?? 0 }}</div>
        <div class="stat-label">加购（权重3）</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-hot">{{ stats.purchaseCount ?? 0 }}</div>
        <div class="stat-label">购买（权重5）</div>
      </div>
    </div>

    <!-- ---------- ② 推荐位配置 ---------- -->
    <el-card class="panel" shadow="never">
      <template #header>
        <div class="panel-head">
          <span>推荐位配置</span>
          <span class="tip">保存后写入 Redis 运行时配置并清除推荐缓存，下一次请求立即生效（无需重启）</span>
        </div>
      </template>
      <el-form inline :model="configForm">
        <el-form-item label="首页推荐位数量">
          <el-input-number v-model="configForm.homeLimit" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="热度统计窗口（天）">
          <el-input-number v-model="configForm.hotDays" :min="1" :max="90" />
        </el-form-item>
        <el-form-item label="推荐缓存 TTL（秒）">
          <el-input-number v-model="configForm.cacheTtlSeconds" :min="60" :max="86400" :step="60" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSaveConfig">保存并热更新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ---------- ③ 热门商品管理（行为构成明细） ---------- -->
    <el-card class="panel" shadow="never">
      <template #header>
        <div class="panel-head">
          <span>热门商品管理</span>
          <span class="tip">近 {{ stats.hotDays ?? 7 }} 天每个商品的行为构成——"为什么热、谁在看/买"</span>
        </div>
      </template>
      <el-table v-loading="hotLoading" :data="hotList" border stripe>
        <el-table-column prop="productId" label="商品ID" width="80" />
        <el-table-column prop="productName" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
        <el-table-column prop="favoriteCount" label="收藏" width="80" align="center" />
        <el-table-column prop="cartCount" label="加购" width="80" align="center" />
        <el-table-column prop="purchaseCount" label="购买" width="80" align="center" />
        <el-table-column label="热度分（权重合计）" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.score }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!hotLoading && hotList.length === 0" description="暂无行为数据，引导用户浏览/加购后即可看到热门构成" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRecommendStats, getRecommendHot, getRecommendConfig, saveRecommendConfig } from '../api/recommend'

/** 推荐效果统计（Dashboard 卡片数据） */
const stats = ref({})
/** 热门商品行为构成列表 */
const hotList = ref([])
const hotLoading = ref(false)
/** 推荐位配置表单 */
const configForm = ref({ homeLimit: 8, hotDays: 7, cacheTtlSeconds: 600 })
const saving = ref(false)

/** 加载统计 + 热门明细 + 配置回显 */
async function loadAll() {
  try {
    const [statsRes, hotRes, cfgRes] = await Promise.all([
      getRecommendStats({ days: 0 }),
      getRecommendHot({ days: 0, limit: 20 }),
      getRecommendConfig()
    ])
    stats.value = statsRes.data || {}
    configForm.value = cfgRes.data || configForm.value
    hotList.value = hotRes.data || []
  } catch {
    ElMessage.error('推荐数据加载失败，请确认后端服务已启动')
  }
}

/** 保存配置（热更新） */
async function onSaveConfig() {
  saving.value = true
  try {
    await saveRecommendConfig(configForm.value)
    ElMessage.success('推荐位配置已更新并生效')
    // 配置变化后热度窗口可能变化，重新拉取统计与热门明细
    const [statsRes, hotRes] = await Promise.all([
      getRecommendStats({ days: 0 }),
      getRecommendHot({ days: 0, limit: 20 })
    ])
    stats.value = statsRes.data || {}
    hotList.value = hotRes.data || []
  } catch {
    ElMessage.error('配置保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.stat-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 16px;
  text-align: center;
  border: 1px solid #f0f0f0;
}

.stat-num {
  font-size: 30px;
  font-weight: 700;
  color: #1d2939;
}

.stat-num.stat-hot {
  color: #ff5000;
}

.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
}

.panel {
  margin-bottom: 16px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.panel-head .tip {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}
</style>

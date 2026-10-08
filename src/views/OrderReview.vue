<template>
  <!-- 评价订单页（阶段 7）：已完成订单逐条商品评价（评分 + 内容 + 图片） -->
  <div v-loading="loading" class="page-container review-page">
    <div class="crumb">
      <router-link to="/orders">我的订单</router-link>
      <span class="sep">/</span>
      <span>评价晒单</span>
    </div>

    <template v-if="order">
      <!-- 状态提示：仅已完成订单可评价 -->
      <div v-if="order.status !== 3" class="tip-box">
        <el-alert
          title="该订单当前状态不可评价（仅已完成订单可评价）"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-button class="back-btn" @click="$router.push(`/order/${order.id}`)">返回订单详情</el-button>
      </div>

      <!-- 逐条商品评价表单 -->
      <div v-else>
        <div class="order-head">
          <span class="order-no">订单号：{{ order.orderNo }}</span>
          <span class="time">{{ formatTime(order.createdAt) }}</span>
          <el-button size="small" @click="$router.push(`/order/${order.id}`)">返回订单详情</el-button>
        </div>

        <div v-for="item in order.items" :key="item.orderItemId" class="review-card">
          <!-- 商品信息 -->
          <div class="item-info">
            <img :src="item.productImage || '/default-product.svg'" class="thumb" alt="" @error="onImgError" />
            <div class="info">
              <router-link :to="`/product/${item.productId}`" class="name">{{ item.productName }}</router-link>
              <span v-if="item.skuName" class="sku-tag">{{ item.skuName }}</span>
              <p class="price">¥{{ Number(item.price).toFixed(2) }} × {{ item.quantity }}</p>
            </div>
          </div>

          <!-- 评价输入 -->
          <div class="form">
            <div class="form-row">
              <span class="label">评分：</span>
              <el-rate v-model="forms[item.orderItemId].rating" :max="5" />
            </div>
            <div class="form-row">
              <span class="label">评价：</span>
              <el-input
                v-model="forms[item.orderItemId].content"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="说说商品的使用感受吧（至少 5 个字）"
              />
            </div>
            <div class="form-row">
              <span class="label">图片：</span>
              <div class="img-inputs">
                <el-input
                  v-for="(img, idx) in formImages[item.orderItemId]"
                  :key="idx"
                  v-model="formImages[item.orderItemId][idx]"
                  placeholder="图片链接（可选），支持多个"
                  size="small"
                  style="width: 300px"
                />
                <el-button size="small" @click="formImages[item.orderItemId].push('')">添加图片</el-button>
                <el-button
                  v-if="formImages[item.orderItemId].length > 1"
                  size="small"
                  type="danger"
                  plain
                  @click="formImages[item.orderItemId].pop()"
                >
                  移除
                </el-button>
              </div>
            </div>
            <div class="submit-row">
              <el-button
                type="danger"
                :loading="submitting[item.orderItemId]"
                :disabled="!forms[item.orderItemId].rating || forms[item.orderItemId].content.trim().length < 5"
                @click="onSubmit(item)"
              >
                提交评价
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="订单不存在" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '../api/order'
import { submitReview } from '../api/review'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(false)

/** 每条订单明细的评价表单：rating / content（以 orderItemId 为键） */
const forms = reactive({})
/** 每条明细的图片链接数组（可空） */
const formImages = reactive({})
/** 每条明细的提交中状态 */
const submitting = reactive({})

/** 加载订单详情并初始化评价表单 */
async function loadOrder(id) {
  loading.value = true
  try {
    const res = await getOrderDetail(id)
    order.value = res.data
    ;(res.data.items || []).forEach((item) => {
      forms[item.orderItemId] = { rating: 5, content: '' }
      formImages[item.orderItemId] = ['']
      submitting[item.orderItemId] = false
    })
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

/** 提交某条商品的评价 */
async function onSubmit(item) {
  const form = forms[item.orderItemId]
  if (!form.rating) {
    ElMessage.warning('请先选择评分')
    return
  }
  if (form.content.trim().length < 5) {
    ElMessage.warning('评价内容至少 5 个字')
    return
  }
  submitting[item.orderItemId] = true
  try {
    // 过滤空图片链接
    const images = formImages[item.orderItemId].map((s) => s.trim()).filter(Boolean)
    await submitReview({
      orderId: order.value.id,
      orderItemId: item.orderItemId,
      rating: form.rating,
      content: form.content.trim(),
      images
    })
    ElMessage.success('评价提交成功，待商家审核后展示')
    // 评价过的明细从表单列表移除（后端已有唯一约束，防止重复提交）
    delete forms[item.orderItemId]
    delete formImages[item.orderItemId]
    if (Object.keys(forms).length === 0) {
      router.push(`/order/${order.value.id}`)
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting[item.orderItemId] = false
  }
}

function onImgError(event) {
  event.target.src = '/default-product.svg'
}

function formatTime(time) {
  if (!time) return '-'
  return String(time).replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadOrder(route.params.id)
})
</script>

<style scoped>
.review-page {
  min-height: 70vh;
  padding-top: 16px;
}

.crumb {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.crumb a {
  color: var(--mall-primary);
  text-decoration: none;
}

.sep {
  margin: 0 6px;
  color: #ccc;
}

.tip-box {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
}

.back-btn {
  margin-top: 16px;
}

.order-head {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 6px 6px 0 0;
  padding: 12px 16px;
  font-size: 13px;
  color: #666;
}

.order-no {
  font-weight: 600;
  color: #333;
}

.time {
  margin-left: auto;
}

.review-card {
  background: #fff;
  border-radius: 0 0 6px 6px;
  padding: 16px;
  margin-bottom: 12px;
  border-top: 1px solid #f5f5f5;
}

.item-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}

.name:hover {
  color: var(--mall-primary);
}

.sku-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.price {
  margin-top: 4px;
  font-size: 13px;
  color: var(--mall-price);
}

.form {
  margin-top: 12px;
  border-top: 1px dashed #f0f0f0;
  padding-top: 12px;
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.form-row .label {
  flex: 0 0 48px;
  font-size: 13px;
  color: #999;
  line-height: 30px;
}

.img-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.submit-row {
  text-align: right;
}
</style>

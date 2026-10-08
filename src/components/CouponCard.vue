<template>
  <!-- 优惠券卡片（电商券样式，可复用于：领券中心 / 我的券 / 结算页选择）
       props：
         coupon  – 券数据（CouponVO 或 UserCouponVO，字段兼容）
         mode    – 'center' 领券中心（带领取按钮）/ 'mine' 我的券（带状态）/ 'select' 结算选择
         selected– select 模式下是否被选中
         disabled– select 模式下是否不可用（门槛不满足等）
       emits：
         receive – 点击领取（center）
         select  – 点击选择（select） -->
  <div
    class="coupon-card"
    :class="[`type-${coupon.type}`, { 'is-selected': selected, 'is-disabled': disabled }]"
    @click="mode === 'select' && !disabled && $emit('select', coupon)"
  >
    <!-- 左侧：面额 / 折扣主展示 -->
    <div class="face">
      <template v-if="coupon.type === 1">
        <span class="unit">¥</span><span class="num">{{ amountText }}</span>
      </template>
      <template v-else>
        <span class="num">{{ discountText }}</span>
        <span class="unit small">折</span>
      </template>
      <p class="threshold">{{ thresholdText }}</p>
    </div>

    <!-- 右侧：券信息 -->
    <div class="info">
      <p class="name">{{ coupon.couponName || coupon.name }}</p>
      <p class="desc">{{ typeText }}</p>
      <p class="expire">{{ expireText }}</p>
      <!-- 领券中心：领取按钮 / 已领取置灰 -->
      <template v-if="mode === 'center'">
        <el-button
          size="small"
          :type="coupon.received ? 'info' : 'danger'"
          :disabled="coupon.received"
          @click.stop="$emit('receive', coupon)"
        >
          {{ coupon.received ? '已领取' : '立即领取' }}
        </el-button>
      </template>
      <!-- 我的券：状态标签 -->
      <template v-else-if="mode === 'mine'">
        <el-tag :type="statusTagType" size="small">{{ coupon.statusText }}</el-tag>
      </template>
      <!-- 结算选择：勾选标记 + 不可用原因 -->
      <template v-else>
        <span v-if="selected" class="check">✓ 已选用</span>
        <span v-else-if="disabled" class="unusable">门槛未达</span>
        <span v-else class="check empty">点击选用</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  coupon: { type: Object, required: true },
  mode: { type: String, default: 'center' },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['receive', 'select'])

/** 满减面额（去掉多余的 .00） */
const amountText = computed(() => Number(props.coupon.amount || 0).toFixed(0))

/** 折扣率 → 中文折扣（0.90 → 9，0.85 → 8.5） */
const discountText = computed(() => {
  const rate = Number(props.coupon.discountRate || 1)
  const zhe = rate * 10
  return Number.isInteger(zhe) ? String(zhe) : zhe.toFixed(1)
})

/** 门槛文案：0 = 无门槛 */
const thresholdText = computed(() => {
  const t = Number(props.coupon.threshold || 0)
  return t > 0 ? `满 ${t.toFixed(0)} 元可用` : '无门槛'
})

/** 类型中文 */
const typeText = computed(() =>
  props.coupon.typeText || (props.coupon.type === 1 ? '满减券' : '折扣券')
)

/** 有效期文案：优先 expireAt（我的券），否则 validFrom~validUntil（模板） */
const expireText = computed(() => {
  const d = props.coupon.expireAt || props.coupon.validUntil
  if (!d) return ''
  return `有效期至 ${String(d).slice(0, 10)}`
})

/** 我的券状态标签颜色：0 未使用橙 / 1 已锁定黄 / 2 已使用灰 / 3 已过期灰 */
const statusTagType = computed(() => {
  const s = props.coupon.status
  if (s === 0) return 'danger'
  if (s === 1) return 'warning'
  return 'info'
})
</script>

<style scoped>
/* 券卡片：电商"左面额右信息"经典布局 */
.coupon-card {
  display: flex;
  width: 100%;
  height: 108px;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0c8b8;
  cursor: default;
  transition: transform 0.15s, box-shadow 0.15s;
}

.coupon-card:hover {
  box-shadow: 0 4px 12px rgba(255, 80, 0, 0.12);
}

/* 结算选择模式：可点击选中 */
.coupon-card.is-selected {
  border: 2px solid var(--mall-primary);
  box-shadow: 0 0 0 2px var(--mall-primary-light);
}

.coupon-card.is-disabled {
  opacity: 0.55;
  filter: grayscale(0.4);
}

/* ---------- 左：面额 ---------- */
.face {
  flex: 0 0 128px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff5000 0%, #ff7a3d 100%);
  color: #fff;
  padding: 8px;
}

/* 折扣券用深色底区分 */
.type-2 .face {
  background: linear-gradient(135deg, #f59a23 0%, #ffb347 100%);
}

.unit {
  font-size: 14px;
  font-weight: 600;
}

.unit.small {
  font-size: 12px;
}

.num {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.threshold {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.92;
}

/* ---------- 右：信息 ---------- */
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 14px;
  gap: 4px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc {
  font-size: 12px;
  color: #999;
}

.expire {
  font-size: 12px;
  color: #bbb;
}

.check {
  font-size: 13px;
  font-weight: 600;
  color: var(--mall-primary);
}

.check.empty {
  color: #bbb;
  font-weight: 400;
}

.unusable {
  font-size: 12px;
  color: #999;
}
</style>

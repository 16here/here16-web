import request from './request'

/**
 * 管理端推荐系统接口封装（阶段 10，对应后端 /api/admin/recommend，仅 ADMIN）。
 * 提供：推荐效果统计、热门商品行为构成、推荐位配置（热更新）。
 */

/** 推荐效果统计（Dashboard 卡片）：?days= 默认按配置窗口 */
export function getRecommendStats(params) {
  return request.get('/admin/recommend/stats', { params })
}

/** 热门商品管理：近 N 天行为构成明细（?days=&limit=） */
export function getRecommendHot(params) {
  return request.get('/admin/recommend/hot', { params })
}

/** 当前生效的推荐位配置（表单回显） */
export function getRecommendConfig() {
  return request.get('/admin/recommend/config')
}

/** 保存推荐位配置（热更新：写 Redis + 清缓存，无需重启立即生效） */
export function saveRecommendConfig(data) {
  return request.put('/admin/recommend/config', data)
}

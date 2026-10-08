<template>
  <!-- 管理端根组件：仅渲染路由页面 -->
  <router-view />
</template>

<script setup>
// 管理端布局（侧边栏导航等）将在后续阶段实现
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f0f2f5;
}
</style>

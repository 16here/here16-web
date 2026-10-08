<template>
  <!-- 全局布局：电商风顶部导航 + 页面内容（页面宽度由各页 page-container 控制） -->
  <Header />
  <main class="app-main">
    <router-view />
  </main>
  <!-- 全局悬浮客服聊天窗（阶段 11.5）：挂载在根组件，全站可见 -->
  <ChatWidget />
</template>

<script setup>
import Header from './components/Header.vue'
import ChatWidget from './views/ChatWidget.vue'
</script>

<style>
/* 全局基础样式统一收敛到 styles/theme.css，这里只保留布局骨架 */
.app-main {
  min-height: calc(100vh - 108px); /* 顶栏 30px + 主区 78px */
}
</style>

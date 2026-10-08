import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/theme.css'   // 商城全局主题（覆盖 Element Plus 主色）
import App from './App.vue'
import router from './router'

// 应用入口：装配 Pinia（状态管理）、Router（路由）、Element Plus（UI 组件库）
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')

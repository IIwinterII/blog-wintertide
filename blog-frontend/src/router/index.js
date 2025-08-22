import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Article from '../components/Article.vue'
import Comments from '../components/Comments.vue'  // 导入Comments组件
import PersonalHome from '../components/PersonalHome.vue'  // 导入PersonalHome组件
import ArticleEditor from '../components/ArticleEditor.vue'  // 导入ArticleEditor组件
import CategoryPage from '../components/CategoryPage.vue'  // 导入CategoryPage组件

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/article/:id', name: 'Article', component: Article },
  { path: '/comments', name: 'Comments', component: Comments },  // 添加Comments路由
  { path: '/personal-home', name: 'PersonalHome', component: PersonalHome },  // 添加PersonalHome路由
  { path: '/article-editor/:id?', name: 'ArticleEditor', component: ArticleEditor },  // 添加ArticleEditor路由，支持可选的id参数
  { path: '/categories', name: 'Category', component: CategoryPage },  // 添加CategoryPage路由
  { path: '/categories/:tag', name: 'CategoryByTag', component: CategoryPage }  // 添加带标签参数的分类路由
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
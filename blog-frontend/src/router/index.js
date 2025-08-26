import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '../components/Welcome.vue'
import Home from '../components/Home.vue'
import Article from '../components/Article.vue'
import Comments from '../components/Comments.vue'
import PersonalHome from '../components/PersonalHome.vue'
import ArticleEditor from '../components/ArticleEditor.vue'
import CategoryPage from '../components/CategoryPage.vue'
import ArchivePage from '../components/ArchivePage.vue'
import LoginComponent from '../components/LoginComponent.vue'

const routes = [
  { path: '/', name: 'Welcome', component: Welcome },
  { path: '/home', name: 'Home', component: Home },
  { path: '/article/:id', name: 'Article', component: Article },
  { path: '/comments', name: 'Comments', component: Comments },
  { path: '/personal-home', name: 'PersonalHome', component: PersonalHome },
  { path: '/login', name: 'Login', component: LoginComponent },
  { path: '/article-editor/:id?', name: 'ArticleEditor', component: ArticleEditor },
  { path: '/archive', name: 'Archive', component: ArchivePage },
  { path: '/categories', name: 'Category', component: CategoryPage },
  { path: '/categories/:tag', name: 'CategoryByTag', component: CategoryPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
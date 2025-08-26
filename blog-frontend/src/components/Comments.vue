<template>
  <div class="comments page">
    <div class="grid">
      <!-- 左侧公告 -->
      <aside class="aside left">
        <section class="card wt-card">
          <h3>公告栏</h3>
          <div class="announce" v-for="(a,i) in announcements" :key="i">
            <div class="date">{{ a.date }}</div>
            <div class="text">{{ a.content }}</div>
          </div>
        </section>
      </aside>

      <!-- 中间留言主区（作为“特殊文章”的评论页） -->
      <main class="main">
        <section class="wt-card header">
          <h2 class="title">留言板</h2>
          <p class="sub wt-muted">欢迎留下你的想法</p>
        </section>

        <section class="wt-card comment-host">
          <ArticleComments :articleId="boardArticleId" @posted="onPosted" @loaded="onLoaded" />
          <!-- 未登录锁定层 -->
          <div v-if="!isLoggedIn" class="lock-mask">
            <div class="lock-box wt-card">
              <i class="fas fa-lock"></i>
              <p>登录后可留言</p>
              <button class="wt-chip" @click="router.push({ name: 'Login' })">
                <i class="fas fa-sign-in-alt"></i> 去登录
              </button>
            </div>
          </div>
        </section>

        <div class="back">
          <button class="wt-chip" @click="goBack">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
        </div>
      </main>

      <!-- 右侧概览与分类 -->
      <aside class="aside right">
        <section class="card wt-card">
          <h3>站点概览</h3>
          <div class="stat"><span>文章总数</span><b>{{ articleCount }}</b></div>
          <div class="stat"><span>分类数量</span><b>{{ categoryCount }}</b></div>
          <div class="stat"><span>留言数量</span><b>{{ boardCommentCount }}</b></div>
          <div class="stat"><span>总浏览量</span><b>{{ viewCount }}</b></div>
        </section>

        <section class="card wt-card">
          <h3>文章分类</h3>
          <div class="cat" v-for="(c,i) in categories" :key="i">
            <span>{{ c.name }}</span>
            <span class="cnt">({{ c.count }})</span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ArticleComments from './ArticleComments.vue'
import apiClient from '../utils/api'

const router = useRouter()

// 登录态与留言板“文章ID”
const isLoggedIn = ref(false)
const boardArticleId = 1

// 公告
const announcements = ref([
  { date: '2024-01-15', content: '本站已升级，新增留言板功能！' },
  { date: '2024-01-10', content: '冬季摄影大赛开始征稿，欢迎投稿！' },
  { date: '2023-12-25', content: '祝大家圣诞快乐，网站 12/25-26 维护。' }
])

// 概览与分类（后端同步）
const articleCount = ref(0)
const categoryCount = ref(0)
const viewCount = ref(12500)
const categories = ref([])
const boardCommentCount = ref(0)

// 来自 ArticleComments 的事件回调，用于更新统计
const onPosted = (count) => { boardCommentCount.value = count }
const onLoaded = (count) => { boardCommentCount.value = count }

onMounted(async () => {
  const userInfo = localStorage.getItem('user_info')
  isLoggedIn.value = !!userInfo

  // 文章总数
  try {
    const res = await apiClient.get('/articles', { _skipLoading: true })
    articleCount.value = Array.isArray(res.data) ? res.data.length : 0
  } catch { articleCount.value = 0 }

  // 分类（需与你后端对齐字段）
  try {
    const tagRes = await apiClient.get('/tags', { _skipLoading: true })
    const list = Array.isArray(tagRes.data) ? tagRes.data : []
    categories.value = list.map(it => ({
      name: it.name || it.tag || it.category || '未分类',
      count: Number(it.count || it.total || 0)
    }))
    categoryCount.value = categories.value.length
  } catch {
    categories.value = []
    categoryCount.value = 0
  }

  // 留言数量（该特殊文章的评论数）
  try {
    const cRes = await apiClient.get('/comments/article/' + boardArticleId, { _skipLoading: true })
    boardCommentCount.value = Array.isArray(cRes.data) ? cRes.data.length : 0
  } catch { boardCommentCount.value = 0 }
})


const goBack = () => router.back()
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.page{
  padding: 120px 16px 40px;
  color: var(--wt-fg);
}
.grid{
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 14px;
}
@media (max-width: 1024px){
  .grid{ grid-template-columns: 1fr 2fr; }
  .aside.right{ grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
}
@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
  .aside.right{ grid-template-columns: 1fr; }
}

/* 主区 */
.header{ padding: 14px; text-align: center; }
.title{ margin: 0; font-size: clamp(22px, 4vw, 32px); }
.sub{ margin: 6px 0 0; }

/* 表单 */
.form{ padding: 14px; }
.row{ margin: 10px 0; }
label{ display:block; margin-bottom: 6px; }
.ipt{
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--wt-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  color: var(--wt-fg);
  outline: none;
}
.actions{ margin-top: 8px; }

/* 列表 */
.list-title{ margin: 14px 0 10px; font-size: 1.1rem; }
.comment{ padding: 12px; }
.meta{
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(207,232,255,0.28);
  padding-bottom: 6px;
}
.meta .name{ font-weight: 600; }
.content{ margin: 0; color: var(--wt-fg-weak); }

.empty{
  margin-top: 10px;
  padding: 18px 12px;
  display: grid; place-items: center; gap: 4px;
}

.back{
  display: flex; justify-content: center;
  margin-top: 12px;
}

/* 侧栏卡片 */
.aside .card{ padding: 12px; }
.announce{
  border-bottom: 1px solid rgba(207,232,255,0.20);
  padding: 8px 0;
}
.announce:last-child{ border-bottom: none; }
.announce .date{ font-size: .86rem; color: var(--wt-fg-mute); }
.announce .text{ color: var(--wt-fg-weak); }

.stat{
  display: flex; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px dashed rgba(207,232,255,0.20);
}
.stat:last-child{ border-bottom: none; }

.cat{
  display: flex; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px dashed rgba(207,232,255,0.20);
}
.cat:last-child{ border-bottom: none; }
.cnt{ color: var(--wt-fg-mute); }
/* 留言板评论锁定遮罩 */
.comment-host { position: relative; padding: 12px; }
.lock-mask{
  position: absolute; inset: 0; z-index: 5;
  background: rgba(6,12,20,.45);
  display: grid; place-items: center;
  backdrop-filter: blur(2px);
  border-radius: var(--wt-radius-md);
}
.lock-box{
  padding: 16px;
  text-align: center;
  display: grid; gap: 8px; place-items: center;
}
.lock-box i{ font-size: 28px; }
</style>

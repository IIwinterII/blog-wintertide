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

      <!-- 中间留言主区 -->
      <main class="main">
        <section class="wt-card header">
          <h2 class="title">留言板</h2>
          <p class="sub wt-muted">欢迎留下你的想法</p>
        </section>

        <section class="wt-card form">
          <h3>发表留言</h3>
          <div class="row">
            <label>昵称</label>
            <input v-model="newComment.name" type="text" class="ipt" placeholder="请输入您的昵称" />
          </div>
          <div class="row">
            <label>留言内容</label>
            <textarea v-model="newComment.content" class="ipt" rows="4" placeholder="请输入您的留言"></textarea>
          </div>
          <div class="actions">
            <button class="wt-chip" @click="addComment">
              <i class="far fa-paper-plane"></i> 提交留言
            </button>
          </div>
        </section>

        <section class="list">
          <h3 class="list-title">留言列表</h3>
          <article v-for="(c,i) in comments" :key="i" class="comment wt-card wt-card--hover">
            <header class="meta">
              <span class="name">{{ c.name }}</span>
              <span class="date">{{ c.date }}</span>
            </header>
            <p class="content">{{ c.content }}</p>
          </article>

          <div v-if="!comments.length" class="empty wt-card">
            <i class="far fa-snowflake"></i>
            暂无留言，写下第一条吧
          </div>

          <div class="back">
            <button class="wt-chip" @click="goBack">
              <i class="fas fa-arrow-left"></i> 返回
            </button>
          </div>
        </section>
      </main>

      <!-- 右侧概览与分类 -->
      <aside class="aside right">
        <section class="card wt-card">
          <h3>站点概览</h3>
          <div class="stat"><span>文章总数</span><b>{{ articleCount }}</b></div>
          <div class="stat"><span>分类数量</span><b>{{ categoryCount }}</b></div>
          <div class="stat"><span>留言数量</span><b>{{ comments.length }}</b></div>
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
import { articlesData } from '../data/articles.js'

const router = useRouter()

// 本地留言
const newComment = ref({ name: '', content: '' })
const comments = ref([])

// 公告
const announcements = ref([
  { date: '2024-01-15', content: '本站已升级，新增留言板功能！' },
  { date: '2024-01-10', content: '冬季摄影大赛开始征稿，欢迎投稿！' },
  { date: '2023-12-25', content: '祝大家圣诞快乐，网站 12/25-26 维护。' }
])

// 概览与分类
const articleCount = ref(articlesData.length)
const categoryCount = ref(3)
const viewCount = ref(12500)
const categories = ref([
  { name: '摄影技巧', count: 1 },
  { name: '滑雪指南', count: 1 },
  { name: '冬季养生', count: 1 }
])

onMounted(() => {
  const saved = localStorage.getItem('wintertide_comments')
  if (saved) comments.value = JSON.parse(saved)
})

const addComment = () => {
  if (!newComment.value.name || !newComment.value.content) {
    alert('请填写完整的留言信息')
    return
  }
  const c = {
    name: newComment.value.name,
    content: newComment.value.content,
    date: new Date().toLocaleString()
  }
  comments.value.unshift(c)
  localStorage.setItem('wintertide_comments', JSON.stringify(comments.value))
  newComment.value = { name: '', content: '' }
}

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
</style>
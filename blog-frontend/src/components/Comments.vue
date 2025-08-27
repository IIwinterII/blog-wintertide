<template>
  <div class="comments page">
    <div class="grid">
      <!-- 左侧公告 -->
      <aside class="aside left">
        <section class="card wt-card">
          <h3>公告栏</h3>
          <div v-if="isAdmin" class="announce-admin">
            <textarea v-model="newAnn" class="ipt" rows="3" placeholder="输入公告内容..."></textarea>
            <div class="actions">
              <button class="wt-chip wt-chip--sm" @click="addAnnouncement"><i class="fas fa-plus"></i> 添加</button>
              <button class="wt-chip wt-chip--sm" @click="saveAnnouncements"><i class="fas fa-save"></i> 保存</button>
            </div>
          </div>
          <div class="announce" v-for="(a,i) in announcements" :key="i">
            <div class="date">{{ a.date }}</div>
            <div class="text">{{ a.content }}</div>
            <div class="ops" v-if="isAdmin">
              <button class="wt-chip wt-chip--sm" @click="removeAnnouncement(i)">删除</button>
            </div>
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

// 登录态与角色、留言板“文章ID”
const isLoggedIn = ref(false)
const isAdmin = ref(false)
const boardArticleId = 1

// 公告
const announcements = ref([
  { date: '2024-01-15', content: '本站已升级，新增留言板功能！' },
  { date: '2024-01-10', content: '冬季摄影大赛开始征稿，欢迎投稿！' },
  { date: '2023-12-25', content: '祝大家圣诞快乐，网站 12/25-26 维护。' }
])
const newAnn = ref('')
const addAnnouncement = () => {
  const txt = String(newAnn.value || '').trim()
  if (!txt) return
  announcements.value.unshift({ date: new Date().toISOString().slice(0,10), content: txt })
  newAnn.value = ''
}
const removeAnnouncement = (i) => { if (i >= 0) announcements.value.splice(i,1) }
const saveAnnouncements = async () => {
  try {
    localStorage.setItem('site_announcements', JSON.stringify(announcements.value))
    // 可选后端保存：若无接口则忽略
    await apiClient.post('/announcements', announcements.value, { _skipLoading: true }).catch(() => {})
    alert('公告已保存')
  } catch {
    alert('公告已保存到本地')
  }
}

// 概览与分类（从文章标签统计，确保与分类页一致）
const articleCount = ref(0)
const categoryCount = ref(0)
const categories = ref([])
const boardCommentCount = ref(0)

const normalizeTags = (v) => {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (!v) return []
  return String(v).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean)
}

// 来自 ArticleComments 的事件回调，用于更新统计
const onPosted = (count) => { boardCommentCount.value = count }
const onLoaded = (count) => { boardCommentCount.value = count }

onMounted(async () => {
  const userInfo = localStorage.getItem('user_info')
  isLoggedIn.value = !!userInfo
  try {
    const user = JSON.parse(userInfo || '{}')
    const uname = String(user?.username || '').toLowerCase()
    isAdmin.value = Boolean(
      (user && user.isAdmin === true) ||
      (user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN' || user.role === 'admin')) ||
      (Array.isArray(user?.roles) && user.roles.some(r => /admin/i.test(String(r)))) ||
      ['admin','winter','wintertide'].includes(uname)
    )
  } catch {}

  // 公告（后端优先，失败则本地）
  try {
    const aRes = await apiClient.get('/announcements', { _skipLoading: true })
    if (Array.isArray(aRes.data) && aRes.data.length) {
      announcements.value = aRes.data
    } else {
      const saved = JSON.parse(localStorage.getItem('site_announcements') || '[]')
      if (Array.isArray(saved) && saved.length) announcements.value = saved
    }
  } catch {
    try {
      const saved = JSON.parse(localStorage.getItem('site_announcements') || '[]')
      if (Array.isArray(saved) && saved.length) announcements.value = saved
    } catch {}
  }

  // 文章总数 + 分类统计（从文章标签聚合）
  try {
    const res = await apiClient.get('/articles', { _skipLoading: true })
    const arr = Array.isArray(res.data) ? res.data : []
    articleCount.value = arr.length
    const map = {}
    for (const a of arr) {
      for (const t of normalizeTags(a.tags)) {
        map[t] = (map[t] || 0) + 1
      }
    }
    categories.value = Object.entries(map).map(([name, count]) => ({ name, count }))
    categoryCount.value = categories.value.length
  } catch {
    articleCount.value = 0
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

/* 公告编辑 */
.announce-admin .actions{ margin-top: 8px; display: flex; gap: 8px; }
.announce .ops{ margin-top: 6px; }
</style>
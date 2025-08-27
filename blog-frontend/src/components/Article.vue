<template>
  <!-- 阅读进度条 -->
  <div id="read-progress"></div>

  <main class="wt-reader">
    <!-- 封面 -->
    <div class="reader-cover" :style="{ backgroundImage: 'url(' + (article.coverUrl || DEFAULT_COVER) + ')' }"></div>

    <!-- 标题 -->
    <h1 class="reader-title">{{ article.title || '未命名文章' }}</h1>

    <!-- 元信息 -->
    <div class="reader-meta">
      <span class="meta-item"><i class="far fa-calendar"></i>{{ article.publishDate || article.date || '未知' }}</span>
      <span class="meta-item"><i class="far fa-user"></i>{{ article.author || '佚名' }}</span>
      <span class="meta-item"><i class="far fa-file-alt"></i>{{ article.wordCount || 'N/A' }}字</span>
    </div>

    <!-- 正文（优先 content，其次 description/summary） -->
    <article class="reader-content">
      <div v-if="article.content" v-html="article.content"></div>
      <template v-else>
        <p class="wt-muted">{{ article.description || article.summary || '这篇文章还没有正文内容。' }}</p>
      </template>
    </article>

    <!-- 标签 -->
    <div v-if="tags.length" class="reader-tags">
      <span v-for="t in tags" :key="t" class="wt-chip wt-chip--sm" @click="goTag(t)">{{ t }}</span>
    </div>
    <button class="fav-btn" :class="{ on: isFav }" @click="toggleFavorite" title="收藏/取消收藏">
      <i v-if="!isFav" class="far fa-heart"></i>
      <i v-else class="fas fa-heart"></i>
    </button>
  </main>

  <!-- 阅读导航：返回 / 上一篇 / 下一篇 -->
  <section class="reader-nav">
    <button class="wt-chip wt-chip--sm" @click="goBack">
      <i class="fas fa-arrow-left"></i> 返回
    </button>
    <button class="wt-chip wt-chip--sm" :disabled="!prevId" @click="goPrev">
      <i class="fas fa-chevron-left"></i> 上一篇
    </button>
    <button class="wt-chip wt-chip--sm" :disabled="!nextId" @click="goNext">
      下一篇 <i class="fas fa-chevron-right"></i>
    </button>
  </section>

  <!-- 评论区（保持原逻辑组件） -->
  <section class="comments-wrap">
    <ArticleComments :key="articleId" :articleId="articleId" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '../utils/api'
import ArticleComments from './ArticleComments.vue'
const DEFAULT_COVER = '/api/upload/cf143969-11c1-4fd7-b1c3-791c54102553.jpg'

const route = useRoute()
const router = useRouter()

const articleId = computed(() => {
  const id = route.params.id
  const n = Number(id)
  return Number.isFinite(n) ? n : id
})

const article = ref({})

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(/[\s,，#、/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
const tags = computed(() => normalizeTags(article.value.tags))

// 收藏：按用户隔离到 localStorage
const username = computed(() => {
  const info = JSON.parse(localStorage.getItem('user_info') || '{}')
  return info?.username || 'guest'
})
const isFav = ref(false)
const favKey = computed(() => `favorites:${username.value}`)

const loadFavoriteState = async () => {
  if (username.value === 'guest') {
    try {
      const list = JSON.parse(localStorage.getItem(favKey.value) || '[]')
      isFav.value = list.some(it => String(it.id) === String(articleId.value))
    } catch {
      isFav.value = false
    }
    return
  }
  try {
    const res = await apiClient.get('/favorites/check', {
      params: { username: username.value, articleId: articleId.value }
    })
    isFav.value = !!(res.data && (res.data.favorite === true || res.data.favorite === 'true'))
  } catch (e) {
    isFav.value = false
  }
}

const toggleFavorite = async () => {
  if (username.value === 'guest') {
    try {
      const raw = localStorage.getItem(favKey.value) || '[]'
      const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
      const idx = list.findIndex(it => String(it.id) === String(articleId.value))
      if (idx >= 0) {
        list.splice(idx, 1)
        isFav.value = false
        window.dispatchEvent(new CustomEvent('wt-favorites-changed', { detail: { user: username.value, id: articleId.value, action: 'remove' } }))
      } else {
        list.unshift({ id: articleId.value, title: article.value.title || '未命名文章' })
        isFav.value = true
        window.dispatchEvent(new CustomEvent('wt-favorites-changed', { detail: { user: username.value, id: articleId.value, action: 'add' } }))
      }
      localStorage.setItem(favKey.value, JSON.stringify(list.slice(0, 200)))
    } catch (e) {
      console.error('收藏失败', e)
    }
    return
  }
  try {
    if (isFav.value) {
      await apiClient.delete('/favorites', { params: { username: username.value, articleId: articleId.value } })
      isFav.value = false
      window.dispatchEvent(new CustomEvent('wt-favorites-changed', { detail: { user: username.value, id: articleId.value, action: 'remove' } }))
    } else {
      await apiClient.post('/favorites', { username: username.value, articleId: articleId.value })
      isFav.value = true
      window.dispatchEvent(new CustomEvent('wt-favorites-changed', { detail: { user: username.value, id: articleId.value, action: 'add' } }))
    }
  } catch (e) {
    console.error('收藏失败', e)
  }
}

// 文章列表用于“上一篇/下一篇”
const articlesList = ref([])
const fetchList = async () => {
  try {
    const list = await apiClient.get('/articles')
    const arr = Array.isArray(list.data) ? list.data : []
    articlesList.value = arr.filter(it => String(it.id) !== '1')
  } catch (e) {
    articlesList.value = []
  }
}
const currentIndex = computed(() => {
  const arr = articlesList.value
  const idStr = String(articleId.value)
  return arr.findIndex(a => String(a.id) === idStr)
})
const prevId = computed(() => currentIndex.value > 0 ? articlesList.value[currentIndex.value - 1]?.id : null)
const nextId = computed(() => (currentIndex.value >= 0 && currentIndex.value < articlesList.value.length - 1) ? articlesList.value[currentIndex.value + 1]?.id : null)

const goBack = () => { router.back() }
const goPrev = () => { if (!prevId.value) return; router.push({ name: 'Article', params: { id: prevId.value } }) }
const goNext = () => { if (!nextId.value) return; router.push({ name: 'Article', params: { id: nextId.value } }) }

const goTag = (t) => {
  router.push({ name: 'Home' })
  // 轻微延迟，交给首页的标签筛选逻辑
  setTimeout(() => {
    const evt = new CustomEvent('wt-filter-tag', { detail: t })
    window.dispatchEvent(evt)
  }, 0)
}

const loadArticle = async () => {
  try {
    // 优先请求详情
    const res = await apiClient.get(`/articles/${articleId.value}`)
    article.value = res.data || {}
    if (!article.value.tags) {
      // 防御性：确保 tags 统一结构
      article.value.tags = normalizeTags(article.value.tags)
    }
  } catch (e) {
    // 回退：从列表中查找
    try {
      const list = await apiClient.get('/articles')
      const arr = Array.isArray(list.data) ? list.data : []
      const found = arr.find(a => String(a.id) === String(articleId.value))
      if (found) {
        article.value = {
          ...found,
          tags: normalizeTags(found.tags)
        }
      } else {
        throw new Error('not found')
      }
    } catch (err) {
      // 最终回退示例
      article.value = {
        id: articleId.value,
        title: '冬夜里的一束光',
        description: '当北风裹挟着雪进入窗缝，茶杯里仍有余温。',
        publishDate: '2025-08-21',
        author: 'Winter',
        wordCount: 1200,
        tags: ['未分类'],
        content: `
          <p>有些故事必须在冬天讲起，像是树枝上的霜花，只有寒冷才能雕刻它的边界。</p>
          <blockquote>“如果没有一场雪，怎么知道春天已经在路上了呢？”</blockquote>
          <p>我们习惯在深夜里写下，像对话，像回声。那些轻微的、诚恳的自我倾诉，最终都会变成抵御风雪的火光。</p>
          <pre><code>// 一段代码也可以很温暖
function cocoa(temp = 'warm') {
  return \`A cup of \${temp} cocoa\`
}
</code></pre>
        `
      }
    }
  }
}

const updateProgress = () => {
  const el = document.documentElement
  const top = el.scrollTop || document.body.scrollTop
  const h = el.scrollHeight - el.clientHeight
  const p = h > 0 ? Math.min(100, Math.max(0, (top / h) * 100)) : 0
  const bar = document.getElementById('read-progress')
  if (bar) bar.style.width = p + '%'
}

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'auto' })
  loadArticle().then(loadFavoriteState)
  fetchList()
  updateProgress()
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress)
})

watch(() => route.params.id, async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await loadArticle()
  loadFavoriteState()
  updateProgress()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', updateProgress)
})
</script>

<!-- 全局冬季主题 -->
<style src="../styles/theme.css"></style>

<!-- 本页微调 -->
<style scoped>
.wt-reader{
  max-width: 900px;
  margin: 120px auto 40px;
  padding: 16px;
  border-radius: 16px;
  background-color: var(--wt-bg-card, #0d1b2a);
  background-image: linear-gradient(145deg, rgba(13,27,42,0.90), rgba(13,27,42,0.74));
  border: 1px solid rgba(207,232,255,0.24);
  box-shadow: 0 22px 54px rgba(7,20,35,.56);
  backdrop-filter: blur(4px);
  color: var(--wt-fg, #e6f0ff);
}
.reader-cover{
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--wt-radius-md);
  background-size: cover;
  background-position: center;
  filter: brightness(0.82) contrast(1.02);
  border: 1px solid rgba(207,232,255,0.28);
  margin-bottom: 14px;
}

.reader-title{
  margin-top: 6px;
}

.reader-meta{
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 6px 0 6px;
  color: var(--wt-fg-mute);
  font-size: .92rem;
}
.meta-item i{ margin-right: 6px; }

.reader-content{
  margin-top: 10px;
  background: rgba(7,20,35,0.78);
  padding: 18px 18px;
  border-radius: 12px;
  box-shadow: inset 0 12px 28px rgba(7,20,35,.45);
  color: var(--wt-fg, #f1f6ff);
  line-height: 1.85;
}

.reader-tags{
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.comments-wrap{
  max-width: 900px;
  margin: 18px auto 80px;
}

.reader-nav{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 16px 0;
}

/* 收藏按钮 */
.wt-reader{ position: relative; }
.fav-btn{
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 44px; height: 44px;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  border: 1px solid rgba(207,232,255,0.28);
  display: grid; place-items: center;
  color: var(--wt-fg);
  box-shadow: 0 12px 30px rgba(13,27,42,.28);
  cursor: pointer;
  transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
  z-index: 5;
}
.fav-btn:hover{
  transform: translateY(-2px);
  background: linear-gradient(145deg, rgba(142,197,255,0.20), rgba(207,232,255,0.12));
  border-color: rgba(142,197,255,0.70);
  box-shadow: 0 16px 40px rgba(13,27,42,.32);
}
.fav-btn.on{ color: #e74c3c; }

.reader-content h1,.reader-content h2,.reader-content h3{ color: var(--wt-fg, #f8fbff); }
.reader-content p,.reader-content li{ color: var(--wt-fg, #eaf2ff); }
.reader-content a{ color: var(--wt-primary, #8ec5ff); text-decoration: underline; text-underline-offset: 2px; }
.reader-content blockquote{
  border-left: 4px solid var(--wt-primary, #8ec5ff);
  background: rgba(142,197,255,0.10);
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--wt-fg, #eaf2ff);
}
.reader-content pre, .reader-content code{ background: rgba(0,0,0,.30); color: #f8f9fa; }
.reader-content pre{ padding: 12px; border-radius: 10px; overflow: auto; }
</style>

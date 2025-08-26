<template>
  <!-- 阅读进度条 -->
  <div id="read-progress"></div>

  <main class="wt-reader">
    <!-- 封面 -->
    <div v-if="article.coverUrl" class="reader-cover" :style="{ backgroundImage: 'url(' + article.coverUrl + ')' }"></div>

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
    <ArticleComments :articleId="articleId" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '../utils/api'
import ArticleComments from './ArticleComments.vue'

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

// 文章列表用于“上一篇/下一篇”
const articlesList = ref([])
const fetchList = async () => {
  try {
    const list = await apiClient.get('/articles')
    const arr = Array.isArray(list.data) ? list.data : []
    articlesList.value = arr
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
        tags: ['随笔', '冬天'],
        content: `
          <p>有些故事必须在冬天讲起，像是树枝上的霜花，只有寒冷才能雕刻它的边界。</p>
          <blockquote>“如果没有一场雪，怎么知道春天已经在路上了呢？”</blockquote>
          <p>我们习惯在深夜里写下日记，像对话，像回声。那些轻微的、诚恳的自我倾诉，最终都会变成抵御风雪的火光。</p>
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
  loadArticle()
  fetchList()
  updateProgress()
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress)
})

watch(() => route.params.id, async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await loadArticle()
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
.reader-cover{
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--wt-radius-md);
  background-size: cover;
  background-position: center;
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
</style>

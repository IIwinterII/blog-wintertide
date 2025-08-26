<template>
  <main class="cat-page">
    <!-- 头部 -->
    <section class="wt-card head-card">
      <h1>分类</h1>
      <p class="wt-muted">按标签浏览文章，发现冬夜里的光</p>
    </section>

    <!-- 标签切换 -->
    <section class="wt-card tabs-card">
      <div class="tabs-scroll">
        <button class="wt-chip" :class="{ 'is-active': activeTag === null }" @click="setTag(null)">
          全部
        </button>
        <button
          v-for="t in tags"
          :key="t"
          class="wt-chip"
          :class="{ 'is-active': activeTag === t }"
          @click="setTag(t)"
        >
          {{ t }}
        </button>
      </div>
    </section>

    <!-- 列表 -->
    <section class="grid">
      <article
        v-for="a in filtered"
        :key="a.id"
        class="wt-card wt-card--hover card"
        @click="gotoArticle(a)"
      >
        <div v-if="a.coverUrl" class="cover" :style="{ backgroundImage: `url(${a.coverUrl})` }"></div>
        <div v-else class="cover placeholder"></div>

        <h3 class="title">{{ a.title }}</h3>
        <p class="desc">{{ a.summary || a.description || '点击查看详情' }}</p>

        <div class="meta">
          <span><i class="far fa-calendar"></i> {{ a.publishDate || a.date || '未知' }}</span>
          <span><i class="far fa-file-alt"></i> {{ a.wordCount || 'N/A' }}字</span>
        </div>

        <div class="tags" v-if="normalizeTags(a.tags).length">
          <span
            v-for="t in normalizeTags(a.tags)"
            :key="t"
            class="wt-chip wt-chip--sm"
            @click.stop="setTag(t)"
          >
            {{ t }}
          </span>
        </div>
      </article>

      <div v-if="!loading && filtered.length === 0" class="wt-card empty">
        <i class="far fa-snowflake"></i>
        <p>该分类暂无文章</p>
      </div>
    </section>
    <div class="bottom-actions">
      <button class="wt-chip wt-chip--sm" @click="router.back()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../utils/api'

const router = useRouter()
const tags = ref([])
const activeTag = ref(null)
const articles = ref([])
const loading = ref(true)

const normalizeTags = (v) => {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (!v) return []
  return String(v).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean)
}
const unique = (arr) => Array.from(new Set(arr))

const fetchTags = async () => {
  try {
    const res = await apiClient.get('/tags')
    const arr = Array.isArray(res.data) ? res.data : []
    const names = arr.map(x => x?.name ?? x?.tagName ?? x?.title ?? x)
                    .map(s => String(s).trim())
                    .filter(Boolean)
    tags.value = unique(names)
  } catch (e) {
    console.error('加载标签失败：', e)
    tags.value = ['随笔', '生活', '技术', '想法']
  }
}
const fetchArticles = async () => {
  try {
    const res = await apiClient.get('/articles')
    const arr = Array.isArray(res.data) ? res.data : []
    articles.value = arr.map(a => ({
      ...a,
      tags: normalizeTags(a.tags)
    }))
  } catch (e) {
    console.error('加载文章失败：', e)
    // 回退示例
    articles.value = [
      {
        id: 1,
        title: '雪后初晴',
        summary: '窗外的光像是从湖面上反弹回来。',
        publishDate: '2025-08-20',
        wordCount: 900,
        tags: ['随笔'],
        coverUrl: ''
      },
      {
        id: 2,
        title: '在风里点灯',
        summary: '冬夜更需要一盏灯。',
        publishDate: '2025-08-22',
        wordCount: 1200,
        tags: ['想法', '生活'],
        coverUrl: ''
      }
    ]
  }
}

const filtered = computed(() => {
  if (!activeTag.value) return articles.value
  return articles.value.filter(a => normalizeTags(a.tags).includes(activeTag.value))
})

const setTag = (t) => {
  activeTag.value = t
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const gotoArticle = (a) => {
  router.push({ name: 'Article', params: { id: a.id } })
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchTags(), fetchArticles()])
  loading.value = false
})
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.cat-page{
  max-width: 1180px;
  margin: 120px auto 80px;
  padding: 0 14px;
  color: var(--wt-fg);
}

.head-card{
  padding: 16px;
  margin-bottom: 12px;
}
.head-card h1{ margin: 0 0 6px; }
.head-card p{ margin: 0; }

.tabs-card{
  padding: 10px;
  margin-bottom: 16px;
}
.tabs-scroll{
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 2px;
}

.grid{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 1100px){ .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px){ .grid{ grid-template-columns: 1fr; } }

.card{
  padding: 14px;
  cursor: pointer;
}

.cover{
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(207,232,255,0.28);
  margin-bottom: 12px;
}
.cover.placeholder{
  background-image: radial-gradient(60% 60% at 50% 20%, rgba(142,197,255,0.28), rgba(207,232,255,0.10));
}

.title{ margin: 2px 0 6px; color: var(--wt-fg); font-size: 1.05rem; }
.desc{ margin: 0 0 8px; color: var(--wt-fg-weak); font-size: .95rem; }
.meta{ display: flex; gap: 10px; flex-wrap: wrap; color: var(--wt-fg-mute); font-size: .86rem; }
.meta i{ margin-right: 6px; }
.tags{ margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

.empty{
  grid-column: 1 / -1;
  display: grid;
  place-items: center;
  min-height: 160px;
  padding: 18px;
  text-align: center;
  gap: 8px;
}
.empty i{ font-size: 28px; }

.bottom-actions{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 14px 0 0;
}
</style>

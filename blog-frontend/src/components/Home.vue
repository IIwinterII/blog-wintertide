<template>
  <div class="page-home">
    <!-- 主页小标题（终态尺寸） -->
    <section class="home-head">
      <h1 class="home-title">Welcome to Wintertide</h1>
      <p class="hero-sub">在雪与光之间，写一段暖意的故事</p>
    </section>

    <!-- 工具条 + 玻璃分段筛选 -->
    <section class="hero-controls">
      <div class="hero-tools">
        <button class="tool-btn" title="留言板" @click="router.push({ name: 'Comments' })">
          <i class="far fa-envelope"></i>
        </button>
        <button class="tool-btn" title="动态" @click="router.push({ name: 'PersonalHome' })">
          <i class="far fa-comment-dots"></i>
        </button>
        <button class="tool-btn" title="归档" @click="router.push({ name: 'Category' })">
          <i class="far fa-clock"></i>
        </button>
        <button class="tool-btn" title="登录" @click="router.push({ name: 'Login' })">
          <i class="fas fa-user"></i>
        </button>
      </div>

      <div class="segment wt-card">
        <button
          class="wt-chip seg-chip"
          :class="{ 'is-active': activeSegment === 'all' }"
          @click="setSegment('all')"
        >
          全部文章
        </button>
        <button
          class="wt-chip seg-chip"
          :class="{ 'is-active': activeSegment === 'latest' }"
          @click="setSegment('latest')"
        >
          最新文章
        </button>
        <button
          class="wt-chip seg-chip"
          :class="{ 'is-active': activeSegment === 'category' }"
          @click="setSegment('category')"
        >
          文章分类
        </button>
      </div>
    </section>

    <!-- 列表区 -->
    <section id="list" class="articles-wrap">
      <div class="articles-grid">
        <article
          v-for="a in displayArticles"
          :key="a.id"
          class="article-card wt-card wt-card--icecut wt-card--hover"
          @click="gotoArticle(a)"
        >
          <span class="wt-sparkle"></span>

          <div class="card-cover" :style="{ backgroundImage: `url(${a.coverUrl || DEFAULT_COVER})` }"></div>

          <h3 class="card-title">{{ a.title }}</h3>
          <p class="card-desc">{{ a.description || a.summary || '这篇文章很神秘，先点进去看看吧~' }}</p>

          <div class="card-meta">
            <span><i class="far fa-calendar"></i> {{ a.publishDate || a.date || '未知' }}</span>
            <span><i class="far fa-user"></i> {{ a.author || '佚名' }}</span>
            <span><i class="far fa-file-alt"></i> {{ a.wordCount || 'N/A' }}字</span>
          </div>

          <div class="card-tags" v-if="(a.tags && a.tags.length) || (typeof a.tags === 'string' && a.tags)">
            <span
              v-for="t in normalizeTags(a.tags)"
              :key="t"
              class="wt-chip wt-chip--sm"
              @click.stop="filterByTag(t)"
            >
              {{ t }}
            </span>
          </div>
        </article>
      </div>

      <!-- 加载更多按钮 -->
      <div v-if="hasMoreArticles" class="load-more-container">
        <button class="load-more-btn wt-card wt-card--icecut" @click="loadMoreArticles">
          <i class="fas fa-arrow-down"></i> 加载更多
        </button>
      </div>

      <!-- 无数据占位 -->
      <div v-if="!loading && displayArticles.length === 0" class="empty">
        <div class="wt-card empty-card">
          <i class="far fa-snowflake"></i>
          <p>这里暂时还没有内容</p>
        </div>
      </div>
      
      <!-- 搜索结果返回按钮 -->
      <div v-if="searchKeyword" class="back-row">
        <button class="wt-chip" @click="clearSearchAndBack">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../utils/api'

const DEFAULT_COVER = '/default-cover.jpg'

const router = useRouter()

const articles = ref([])
const loading = ref(true)
const activeSegment = ref('latest')
const selectedTag = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(9) // 每页显示9个文章卡片
const hasMoreArticles = ref(true) // 是否还有更多文章可加载

// 归一化 tags
const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (!tags) return []
  return String(tags)
    .split(/[\\s,，#、/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const containsKw = (a, kw) => {
  if (!kw) return true
  const k = kw.toLowerCase()
  const fields = [
    a.title,
    a.description,
    a.summary,
    normalizeTags(a.tags).join(' ')
  ]
  return fields.some(v => String(v || '').toLowerCase().includes(k))
}

// 过滤和排序后的所有文章
const filteredArticles = computed(() => {
  let arr = [...articles.value]

  // 标签过滤
  if (selectedTag.value) {
    arr = arr.filter((a) => normalizeTags(a.tags).includes(selectedTag.value))
  }

  // 搜索关键字过滤
  if (searchKeyword.value.trim()) {
    arr = arr.filter((a) => containsKw(a, searchKeyword.value))
  }

  // 最新排序
  if (activeSegment.value === 'latest') {
    arr.sort(
      (a, b) =>
        new Date(b.publishDate || b.date || 0) - new Date(a.publishDate || a.date || 0)
    )
  }

  return arr
})

// 当前页显示的文章
const displayArticles = computed(() => {
  const startIndex = 0
  const endIndex = currentPage.value * pageSize.value
  return filteredArticles.value.slice(startIndex, endIndex)
})

// 检查是否还有更多文章可加载
const checkMoreArticles = () => {
  hasMoreArticles.value = displayArticles.value.length < filteredArticles.value.length
}

// 加载更多文章
const loadMoreArticles = () => {
  if (hasMoreArticles.value) {
    currentPage.value++
    checkMoreArticles()
  }
}

const gotoArticle = (a) => {
  router.push({ name: 'Article', params: { id: a.id } })
}

const setSegment = (seg) => {
  activeSegment.value = seg
  if (seg !== 'category') {
    selectedTag.value = null
  }
  // 重置分页
  currentPage.value = 1
  checkMoreArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const filterByTag = (tag) => {
  selectedTag.value = tag
  activeSegment.value = 'all'
  // 重置分页
  currentPage.value = 1
  checkMoreArticles()
}

const onFilterTag = (e) => {
  selectedTag.value = e.detail
  activeSegment.value = 'all'
  // 重置分页
  currentPage.value = 1
  checkMoreArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onSearch = (e) => {
  searchKeyword.value = String(e.detail || '').trim()
  activeSegment.value = 'all'
  // 重置分页
  currentPage.value = 1
  checkMoreArticles()
  // 定位到列表
  location.hash = 'list'
}

const clearSearchAndBack = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  checkMoreArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onWheelTopToWelcome = (e) => {
  if ((window.scrollY || window.pageYOffset || 0) === 0 && e.deltaY < -10) {
    e.preventDefault?.()
    router.replace({ name: 'Welcome' })
  }
}
let touchStartY = 0
const onTouchStartTop = (e) => { touchStartY = e.touches[0].clientY }
const onTouchMoveTop = (e) => {
  if ((window.scrollY || window.pageYOffset || 0) === 0) {
    const dy = e.touches[0].clientY - touchStartY
    if (dy > 26) {
      router.replace({ name: 'Welcome' })
    }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await apiClient.get('/articles')
    articles.value = (res.data || [])
      .filter(a => String(a.id) !== '1')
      .map((a) => ({
        ...a,
        tags: normalizeTags(a.tags),
      }))
    checkMoreArticles()
  } catch (e) {
    console.error('加载文章失败:', e)
    articles.value = [
      {
        id: 2,
        title: '当连接不再，奏一首冬日序曲',
        description: '当初雪落下，故事便有了新的章节。',
        publishDate: '2025-08-21',
        author: 'Winter',
        wordCount: 1200,
        tags: [ '冬天'],
        coverUrl: '',
      },
      {
        id: 3,
        title: '北风与火光',
        description: '在寒夜里，光会更暖。',
        publishDate: '2025-08-20',
        author: 'Winter',
        wordCount: 980,
        tags: ['冬天'],
        coverUrl: '',
      },
    ]
    checkMoreArticles()
  } finally {
    loading.value = false
  }

  // 事件监听
  window.addEventListener('wt-filter-tag', onFilterTag)
  window.addEventListener('wt-search', onSearch)

  // 顶部上滚返回欢迎页
  window.addEventListener('wheel', onWheelTopToWelcome, { passive: false })
  window.addEventListener('touchstart', onTouchStartTop, { passive: true })
  window.addEventListener('touchmove', onTouchMoveTop, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('wt-filter-tag', onFilterTag)
  window.removeEventListener('wt-search', onSearch)
  window.removeEventListener('wheel', onWheelTopToWelcome)
  window.removeEventListener('touchstart', onTouchStartTop)
  window.removeEventListener('touchmove', onTouchMoveTop)
})
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.page-home { position: relative; padding: 120px 20px 60px; }

/* 小标题（与“欢迎页缩小终态”一致） */
.home-head{ text-align: center; margin: 0 auto 12px; }
.home-title{ font-size: clamp(28px, 4.6vw, 48px); font-weight: 700; letter-spacing: .6px; color: #e6f0ff; margin: 0 0 6px; text-shadow: 0 10px 30px rgba(7,20,35,.45); }
.hero-sub{ color: rgba(230,240,255,.82); margin: 0; }

/* 工具条与分段 */
.hero-controls{ max-width: 1200px; margin: 0 auto 12px; }
.hero-tools { display: flex; gap: 14px; margin: 0 auto 16px; width: fit-content; }
.tool-btn { width: 56px; height: 56px; border-radius: 16px; border: 1px solid rgba(207, 232, 255, 0.35); background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06)); color: #e6f0ff; box-shadow: 0 10px 30px rgba(7, 20, 35, 0.35); backdrop-filter: blur(14px); display: grid; place-items: center; cursor: pointer; transition: transform 0.25s ease, background 0.25s ease; }
.tool-btn:hover { transform: translateY(-2px); background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.10)); }

.segment { display: flex; gap: 12px; margin: 0 auto; padding: 10px 12px; border-radius: 999px; width: fit-content; border: 1px solid rgba(207, 232, 255, 0.35); background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08)); backdrop-filter: blur(16px); box-shadow: 0 10px 30px rgba(7, 20, 35, 0.30); }
.seg-chip { min-width: 110px; justify-content: center; }
.seg-chip.is-active { background: linear-gradient(145deg, rgba(142, 197, 255, 0.9), rgba(207, 232, 255, 0.75)); color: #0d1b2a; border-color: rgba(142, 197, 255, 0.8); }

/* 列表区 */
.articles-wrap { max-width: 1200px; margin: 28px auto 0; }
.articles-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
@media (max-width: 1100px) { .articles-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .articles-grid { grid-template-columns: 1fr; } }

.article-card { position: relative; overflow: hidden; cursor: pointer; padding: 18px 18px 16px; }
.card-cover { width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; background-size: cover; background-position: center; margin-bottom: 14px; border: 1px solid rgba(207, 232, 255, 0.28); }
.card-cover.placeholder { background-image: radial-gradient(60% 60% at 50% 20%, rgba(142, 197, 255, 0.28), rgba(207, 232, 255, 0.10)); }

.card-title { font-size: 1.1rem; color: #e6f0ff; margin: 2px 0 6px; }
.card-desc { font-size: 0.95rem; color: rgba(230, 240, 255, 0.82); margin-bottom: 10px; }
.card-meta { display: flex; gap: 10px; flex-wrap: wrap; color: rgba(230, 240, 255, 0.72); font-size: 0.86rem; }
.card-meta i { margin-right: 6px; }

.card-tags { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }

.empty { display: grid; place-items: center; padding: 36px 0 18px; }
.empty-card { display: grid; place-items: center; min-height: 160px; color: #e6f0ff; font-size: 1rem; }
.empty-card i { font-size: 28px; margin-bottom: 8px; }

/* 加载更多按钮 */
.load-more-container { display: flex; justify-content: center; margin-top: 24px; }
.load-more-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08)); color: #e6f0ff; cursor: pointer; transition: transform 0.25s ease, background 0.25s ease; border: 1px solid rgba(207, 232, 255, 0.35); }
.load-more-btn:hover { transform: translateY(-2px); background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.10)); }
.load-more-btn i { font-size: 14px; }

/* 返回按钮行 */
.back-row { margin: 24px 0; display: flex; justify-content: center; }
</style>
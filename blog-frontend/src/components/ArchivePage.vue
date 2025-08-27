<template>
  <main class="archive-page">
    <!-- 顶部切换：归档 / 分类 -->
    <section class="archive-tabs">
      <button class="wt-chip is-active">归档</button>
      <button class="wt-chip" @click="router.push({ name: 'Category' })">分类</button>
    </section>

    <!-- 头部 -->
    <section class="wt-card head-card">
      <h1>归档</h1>
      <p class="wt-muted">按时间浏览文章</p>
    </section>

    <!-- 时间线 -->
    <section class="wt-card tl-wrap" v-if="Object.keys(grouped).length">
      <div class="tl" v-for="(months, year) in grouped" :key="year">
        <div class="year">
          <span class="y">{{ year }}</span>
        </div>
        <div class="months">
          <div class="m-block" v-for="(items, month) in months" :key="month">
            <div class="m-head">
              <span class="dot"></span>
              <span class="m">{{ month }} 月</span>
            </div>
            <ul class="list">
              <li v-for="a in items" :key="a.id" @click="goto(a)">
                <span class="date">{{ formatDay(a) }}</span>
                <span class="title">{{ a.title }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 空态 -->
    <section v-else class="placeholder wt-card">
      <i class="far fa-clock"></i>
      <p class="wt-muted">暂无文章</p>
    </section>
    
    <!-- 返回按钮 -->
    <section class="back-row">
      <button class="wt-chip" @click="router.back()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '../utils/api'

const router = useRouter()
const articles = ref([])

const format = (d) => {
  const dt = new Date(d || 0)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return { y, m, day }
}
const formatDay = (a) => format(a.publishDate || a.date).day

const grouped = computed(() => {
  // 生成 { [year]: { [month]: Article[] } }
  const map = {}
  const arr = [...articles.value]
  arr.sort((a,b) => new Date(b.publishDate || b.date || 0) - new Date(a.publishDate || a.date || 0))
  for (const a of arr) {
    const { y, m } = format(a.publishDate || a.date)
    if (!map[y]) map[y] = {}
    if (!map[y][Number(m)]) map[y][Number(m)] = []
    map[y][Number(m)].push(a)
  }
  // 月份从大到小排序
  const sorted = {}
  Object.keys(map).sort((a,b) => Number(b) - Number(a)).forEach(y => {
    const months = map[y]
    const sortedMonths = {}
    Object.keys(months).sort((a,b) => Number(b) - Number(a)).forEach(m => {
      sortedMonths[m] = months[m]
    })
    sorted[y] = sortedMonths
  })
  return sorted
})

const goto = (a) => {
  router.push({ name: 'Article', params: { id: a.id } })
}

onMounted(async () => {
  try {
    const res = await apiClient.get('/articles')
    articles.value = (Array.isArray(res.data) ? res.data : []).filter(a => String(a.id) !== '1')
  } catch (e) {
    articles.value = []
  }
})
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.archive-page{
  max-width: 1180px;
  margin: 120px auto 80px;
  padding: 0 14px;
  color: var(--wt-fg);
}

/* 顶部切换按钮（与分类页一致） */
.archive-tabs{
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
}
.archive-tabs .wt-chip{
  min-width: 110px;
  justify-content: center;
}
.archive-tabs .wt-chip.is-active{
  background: linear-gradient(145deg, rgba(142,197,255,0.90), rgba(207,232,255,0.75));
  color: #0d1b2a;
  border-color: rgba(142,197,255,0.80);
}

.head-card{ padding: 16px; margin-bottom: 12px; }

/* 时间线 */
.tl-wrap{ padding: 12px; }
.tl{ display: grid; grid-template-columns: 120px 1fr; gap: 10px; position: relative; }
.year .y{
  font-size: 28px; font-weight: 800; color: rgba(142,197,255,.95);
}
.months{ position: relative; }
.months::before{
  content:""; position:absolute; left: 10px; top:0; bottom:0;
  width: 2px; background: rgba(142,197,255,.35);
}

.m-block{ padding: 8px 0 4px 0; }
.m-head{
  display:flex; align-items:center; gap:10px; margin: 4px 0 6px 0;
  position: relative;
}
.m-head .dot{
  width:10px; height:10px; border-radius:50%;
  background: rgba(142,197,255,1); box-shadow: 0 0 0 4px rgba(142,197,255,.22);
  margin-left: 6px;
}
.m-head .m{ color: rgba(142,197,255,.95); font-weight: 700; }

.list{ list-style:none; margin:0; padding:0 0 8px 0; }
.list li{
  display:grid; grid-template-columns: 56px 1fr; align-items:center; gap:10px;
  padding: 6px 10px; margin: 0 0 6px 0; border-radius: 12px;
  border: 1px solid rgba(207,232,255,0.28);
  background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
  cursor:pointer;
  transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.list li:hover{
  transform: translateY(-2px);
  background: linear-gradient(145deg, rgba(142,197,255,0.20), rgba(207,232,255,0.12));
  border-color: rgba(142,197,255,0.70);
  box-shadow: 0 16px 40px rgba(13,27,42,.28), 0 0 0 1px rgba(142,197,255,0.35) inset;
}
.date{ color: rgba(230,240,255,.82); font-weight:600; }
.title{ color: var(--wt-fg); }

/* 响应式 */
@media (max-width: 700px){
  .tl{ grid-template-columns: 90px 1fr; }
  .list li{ grid-template-columns: 46px 1fr; }
}

/* 返回按钮行 */
.back-row {
  margin: 14px 0;
  display: flex;
  justify-content: center;
}
</style>

<template>
  <div class="app-root" :class="{ 'night-mode': isNight, 'day-mode': !isNight }">
    <!-- 背景层：视频 + 遮罩 + 极光 -->
    <div class="bg">
      <!-- 双视频交叉淡入，避免切换时黑屏 -->
      <video
        class="bg-video"
        :class="{ 'is-active': !isNight }"
        :src="videoDaySrc"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      ></video>
      <video
        class="bg-video"
        :class="{ 'is-active': isNight }"
        :src="videoNightSrc"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
      ></video>
      <div class="gradient-overlay"></div>
      <div class="wt-aurora-layer"></div>
    </div>

    <!-- 顶部导航 -->
    <header class="navbar glass">
      <div class="nav-left">
        <router-link class="brand wt-chip" :to="{ name: 'Welcome' }">
          <i class="fas fa-paper-plane"></i>
          <span class="brand-text">Wintertide</span>
        </router-link>
      </div>

      <nav class="nav-center">
        <router-link class="wt-chip nav-chip" :to="{ name: 'Home' }">
          <i class="fas fa-home"></i> 首页
        </router-link>
        <router-link class="wt-chip nav-chip" :to="{ name: 'Login' }">
          <i class="fas fa-user"></i> 登录
        </router-link>
        <router-link class="wt-chip nav-chip" :to="{ name: 'PersonalHome' }">
          <i class="far fa-comment-dots"></i> 动态
        </router-link>
        <router-link class="wt-chip nav-chip" :to="{ name: 'Category' }">
          <i class="far fa-clock"></i> 归档
        </router-link>
        <router-link class="wt-chip nav-chip" :to="{ name: 'Comments' }">
          <i class="far fa-envelope"></i> 留言板
        </router-link>
      </nav>

      <div class="nav-right">
        <button class="tool-btn" title="回到顶部" @click="scrollToTop">
          <i class="fas fa-arrow-up"></i>
        </button>
        <button class="tool-btn" title="搜索" @click="openSearch">
          <i class="fas fa-search"></i>
        </button>
        <button class="tool-btn" title="昼/夜切换" @click="toggleNight">
          <i v-if="isNight" class="fas fa-moon"></i>
          <i v-else class="fas fa-sun"></i>
        </button>
      </div>
    </header>

    <!-- 路由过渡 -->
    <div class="page-host">
      <router-view v-slot="{ Component }">
        <transition name="route-fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 搜索弹层 -->
    <div v-if="showSearch" class="search-mask" @click.self="closeSearch">
      <div class="wt-card search-card">
        <div class="search-row">
          <i class="fas fa-search"></i>
          <input
            v-model="searchKeyword"
            class="search-input"
            type="text"
            placeholder="搜索文章标题、描述或标签（Enter 执行搜索，Esc 关闭）"
            @keydown.enter="doSearch"
            autofocus
          />
          <button class="wt-chip" @click="doSearch">搜索</button>
        </div>
        <p class="tip wt-muted">按 Esc 关闭</p>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Footer from './components/Footer.vue'

const router = useRouter()

const isNight = ref(false)
const showSearch = ref(false)
const searchKeyword = ref('')

// 初始化昼/夜
onMounted(() => {
  const cached = localStorage.getItem('wt-night')
  if (cached != null) {
    isNight.value = cached === '1'
  } else {
    const hour = new Date().getHours()
    isNight.value = hour >= 18 || hour < 6
  }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const toggleNight = () => {
  isNight.value = !isNight.value
  localStorage.setItem('wt-night', isNight.value ? '1' : '0')
}

const openSearch = () => { showSearch.value = true }
const closeSearch = () => { showSearch.value = false; searchKeyword.value = '' }
const onKey = (e) => {
  if (e.key === 'Escape' && showSearch.value) closeSearch()
}
const doSearch = () => {
  const kw = searchKeyword.value.trim()
  if (!kw) return
  router.push({ name: 'Home' }).then(() => {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('wt-search', { detail: kw }))
    }, 50)
  })
  closeSearch()
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 背景视频源
const videoDaySrc = computed(() => new URL('./assets/videos/day/background.mp4', import.meta.url).href)
const videoNightSrc = computed(() => new URL('./assets/videos/night/background1.mp4', import.meta.url).href)
</script>

<style src="./styles/theme.css"></style>

<style scoped>
.app-root { min-height: 100vh; }

/* 背景层 */
.bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
.bg-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .6s ease; }
.bg-video.is-active { opacity: 1; }
.gradient-overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(to bottom, rgba(6, 12, 20, 0.85), rgba(6, 12, 20, 0.25) 35%, rgba(6, 12, 20, 0.65) 100%),
    linear-gradient(to top, rgba(6, 12, 20, 0.3), rgba(6, 12, 20, 0) 30%);
  pointer-events: none;
}
/* 日间更亮的遮罩（减少暗度） */
.day-mode .gradient-overlay{
  background:
    linear-gradient(to bottom, rgba(20,30,45,0.40), rgba(20,30,45,0.16) 35%, rgba(20,30,45,0.38) 100%),
    linear-gradient(to top, rgba(20,30,45,0.16), rgba(20,30,45,0) 30%);
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: min(1180px, 96%);
  height: 64px;
  padding: 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(207, 232, 255, 0.35);
  background: linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px rgba(7, 20, 35, 0.3);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}
.nav-left { display: flex; align-items: center; gap: 10px; }
.nav-center { display: flex; gap: 10px; justify-content: center; }
.nav-right { 
  display: flex; 
  gap: 10px; 
  justify-content: flex-end; 
  align-items: center; 
}
.nav-right .tool-btn i { 
  line-height: 1; 
  display: inline-block; 
  vertical-align: middle; 
}

.brand .brand-text { font-weight: 600; letter-spacing: .3px; }

/* 工具按钮 */
.tool-btn {
  width: 44px; height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(207, 232, 255, 0.35);
  background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  color: #e6f0ff;
  box-shadow: 0 10px 30px rgba(7, 20, 35, 0.35);
  backdrop-filter: blur(14px);
  display: grid; place-items: center;
  cursor: pointer;
  transition: transform .25s ease, background .25s ease;
}
.tool-btn:hover { transform: translateY(-2px); background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10)); }

.nav-chip.router-link-active,
.nav-chip.router-link-exact-active {
  background: linear-gradient(145deg, rgba(142, 197, 255, 0.9), rgba(207, 232, 255, 0.75));
  color: #0d1b2a;
  border-color: rgba(142, 197, 255, 0.8);
}

/* 路由视图层级 */
.page-host { position: relative; z-index: 2; min-height: 60vh; }

/* 搜索弹层 */
.search-mask{
  position: fixed; inset:0; z-index: 20;
  display: grid; place-items: center;
  background: rgba(6,12,20,.45);
  backdrop-filter: blur(4px);
}
.day-mode .search-mask{ background: rgba(20,30,45,.28) }
.search-card{ width: min(720px, 92%); padding: 16px; }
.search-row{
  display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px;
}
.search-input{
  width: 95%; padding: 12px 14px;
  border-radius: 14px; border: 1px solid rgba(207,232,255,0.35);
  background: linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  color: var(--wt-fg);
  outline: none;
}
/* 日间搜索输入去亮化，降低白度与对比 */
.day-mode .search-input{
  border-color: rgba(207,232,255,0.25);
  background: linear-gradient(145deg, rgba(245,247,252,0.06), rgba(235,240,248,0.02));
  color: #e6eef9;
}
.tip{ margin: 8px 0 0; text-align: right; }

/* 小屏自适应：缩小导航按钮与间距 */
@media (max-width: 700px){
  .navbar{ height: 56px; padding: 8px 10px; }
  .nav-center{ gap: 8px; }
  .tool-btn{ width: 40px; height: 40px; border-radius: 10px; }
  .nav-chip{ padding: 6px 10px; font-size: .92rem; }
}
@media (max-width: 480px){
  .navbar{ height: 52px; padding: 6px 8px; }
  .nav-center{ gap: 6px; }
  .tool-btn{ width: 36px; height: 36px; border-radius: 10px; }
  .nav-chip{ padding: 5px 8px; font-size: .85rem; }
  .brand .brand-text{ display: none; }
}
</style>

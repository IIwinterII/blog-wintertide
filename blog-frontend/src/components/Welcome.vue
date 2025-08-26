<template>
  <div class="welcome" :class="{ leaving }">
    <div class="center">
      <h1 class="title wt-bounce">Welcome to Wintertide</h1>
      <button class="hint wt-hint-down" @click="enter" aria-label="进入主页">
        <i class="fas fa-angle-down"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const leaving = ref(false)
let locked = false
let touchStartY = 0

const enter = () => {
  if (locked) return
  locked = true
  leaving.value = true
  // 禁止页面在离场动画时滚动，避免拉动背景
  const html = document.documentElement
  const prevOverflow = html.style.overflow
  html.style.overflow = 'hidden'
  setTimeout(() => {
    html.style.overflow = prevOverflow
    router.replace({ name: 'Home' }).catch(() => router.replace('/home'))
  }, 520) // 与 CSS 过渡时长同步
}

const onWheel = (e) => {
  if (locked) return
  if (e.deltaY > 10) {
    e.preventDefault()
    enter()
  }
}
const onTouchStart = (e) => {
  if (locked) return
  touchStartY = e.touches[0].clientY
}
const onTouchMove = (e) => {
  if (locked) return
  const dy = touchStartY - e.touches[0].clientY
  if (dy > 18) {
    e.preventDefault()
    enter()
  }
}
const onKey = (e) => {
  if (locked) return
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault()
    enter()
  }
}

onMounted(() => {
  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('keydown', onKey)
})
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.welcome{
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding-top: 120px; /* 让顶部导航不遮挡 */
  transition: transform .52s cubic-bezier(.22,.61,.36,1), opacity .52s ease;
}
.welcome.leaving{
  transform: translateY(-14px) scale(.86);
  opacity: 0;
  pointer-events: none;
}
.center{
  display: grid;
  gap: 300px;
  place-items: center;
  transform: translateY(-4vh);
}
.title{
  margin: 0;
  font-weight: 800;
  letter-spacing: .5px;
  /* 初始更大，体现欢迎氛围；进入主页由 CSS 过渡淡出 */
  font-size: clamp(40px, 9vw, 120px);
  text-shadow: 0 6px 28px rgba(0,0,0,.28);
}
.hint{
  margin-top: -170px;
  border: none;
  background: transparent;
  color: var(--wt-fg);
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  padding: 10px 12px;
  border-radius: 50%;
  transition: transform .2s ease, opacity .2s ease;
}
.hint:hover{ transform: translateY(2px) scale(1.06); opacity: 0.9; }
</style>
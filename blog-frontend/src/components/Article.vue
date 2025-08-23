<template>
 <!-- 文章详情容器 -->
  <div class="article-detail-container">
   <!-- 加载动画 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载文章中...</p>
      </div>
    </div>
   
   <!-- 文章内容过渡 -->
    <Transition name="article-fade" mode="out-in">
      <div v-if="article !== null" :key="article ? article.id : 'not-found'">
        <div v-if="article" class="article-detail">
     <!-- 文章标题 -->
      <h1>{{ article.title }}</h1>
       <!-- 文章元信息 -->
        <div class="article-meta">
         <span><i class="far fa-calendar"></i> {{ article.publishDate }}</span> <!-- 文章日期 -->
          <span><i class="far fa-user"></i> {{ article.author }}</span> <!-- 文章作者 -->
           </div>
            <!-- 文章内容区域 -->
             <div class="article-content">
             
              <!-- 实际应用中可能需要富文本编辑器生成的内容 -->
             <div class="placeholder-content">
           <!-- 文章内容 -->
               <div class="article-text-content" v-html="article.content"></div>
          </div>
         <!-- 文章导航按钮组 -->
        <div class="article-navigation">
       <!-- 上一篇按钮 -->
      <button v-if="hasPrevArticle" class="nav-button prev-button" @click="navigateToPrev">
     <i class="fas fa-chevron-left"></i> 上一篇
    </button>
   <!-- 返回按钮 -->
  <button class="back-button" @click="goBack">返回
</button>
 <!-- 下一篇按钮 -->
  <button v-if="hasNextArticle" class="nav-button next-button" @click="navigateToNext">下一篇
   <i class="fas fa-chevron-right"></i>
    </button>
     </div>
      </div>
       <!-- 集成评论组件 -->
        <ArticleComments :articleId="article.id.toString()" @showLogin="showLogin" />
         </div>
        </div>
        <div v-else class="not-found">
            <h2>文章未找到</h2>
             <p>抱歉，请求的文章不存在或已被删除。</p>
              <button class="back-button" @click="goBack">
               <i class="fas fa-arrow-left"></i> 返回
                </button>
              </div>
    </Transition>
          </div>
             </template>
<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, onUnmounted, inject, defineEmits, computed, watch } from 'vue'
// 导入路由相关函数
import { useRoute, useRouter } from 'vue-router'
// 导入评论组件
import ArticleComments from './ArticleComments.vue'
import axios from 'axios';
// 获取当前路由
const route = useRoute()
// 获取路由实例
const router = useRouter()
// 文章数据
const article = ref(null)
// 加载状态
const isLoading = ref(false)

// 已合并到下方的onMounted钩子函数中
const emit = defineEmits(['showLogin'])
// 当前文章索引
const currentIndex = ref(-1)

// 计算是否有上一篇文章
const hasPrevArticle = computed(() => currentIndex.value > 0)
// 计算是否有下一篇文章
const hasNextArticle = computed(() => {
  if (!articlesData.value || articlesData.value.length === 0 || currentIndex.value === -1) return false
  return currentIndex.value < articlesData.value.length - 1
})

// 返回函数
const goBack = () => {
  // 保存当前阅读位置
  const scrollPosition = window.scrollY
  localStorage.setItem(`scrollPosition_${route.params.id}`, scrollPosition)
  
  // 获取当前文章id
  const id = route.params.id
  // 导航回首页，并传递文章id作为查询参数
  // Home.vue中会监听这个参数并滚动到对应文章位置
  router.push({ name: 'Home', query: { returnToArticleId: id } })
}

// 导航到上一篇文章
const navigateToPrev = () => {
  if (currentIndex.value > 0) {
    const prevArticle = articlesData.value[currentIndex.value - 1]
    router.push({ name: 'Article', params: { id: prevArticle.id } })
  }
}

// 导航到下一篇文章
const navigateToNext = () => {
  console.log('导航到下一篇文章:', { currentIndex: currentIndex.value, articlesLength: articlesData.value.length })
  if (currentIndex.value !== -1 && currentIndex.value < articlesData.value.length - 1) {
    const nextArticle = articlesData.value[currentIndex.value + 1]
    console.log('下一篇文章:', nextArticle)
    // 确保ID是字符串类型
    router.push({ name: 'Article', params: { id: nextArticle.id.toString() } })
  } else {
    console.log('没有下一篇文章')
    // 可以添加一个提示，告知用户没有下一篇文章
    alert('已经是最后一篇文章了')
  }
}

// 显示登录弹窗
const showLogin = () => {
  emit('showLogin')
}

// 文章数据列表
const articlesData = ref([])

// 加载文章数据的函数
const loadArticleData = async (id) => {
  console.log('加载文章数据, ID:', id)
  try {
    // 显示加载状态
    isLoading.value = true
    // 重置文章数据
    article.value = null
    currentIndex.value = -1
    // 确保有足够时间让加载动画显示
    await new Promise(resolve => setTimeout(resolve, 300))

    // 获取单篇文章详情
    const articleResponse = await axios.get(`/api/articles/${id}`);
    article.value = articleResponse.data;
    console.log('加载的文章:', article.value)

    // 获取所有文章以确定上下篇关系
    const articlesResponse = await axios.get('/api/articles');
    // 按发布日期排序文章（最新的在前）
    articlesData.value = articlesResponse.data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    console.log('所有文章:', articlesData.value)

    // 查找当前文章在数据中的索引
    currentIndex.value = articlesData.value.findIndex(a => a.id.toString() === id)
    console.log('当前文章索引:', currentIndex.value)

    // 确保页面滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('加载文章详情失败:', error);
  } finally {
    // 隐藏加载状态
    isLoading.value = false
  }
}

// 组件挂载时执行
onMounted(() => {
  const id = route.params.id;
  loadArticleData(id)
  
  // 尝试恢复之前的阅读位置
  setTimeout(() => {
    const savedPosition = localStorage.getItem(`scrollPosition_${id}`)
    if (savedPosition) {
      window.scrollTo({ top: parseInt(savedPosition), behavior: 'smooth' })
    }
  }, 500)
})

// 监听路由参数变化
const routeParamsChange = watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      console.log('路由参数变化，新ID:', newId)
      loadArticleData(newId)
      
      // 尝试恢复新文章的阅读位置
      setTimeout(() => {
        const savedPosition = localStorage.getItem(`scrollPosition_${newId}`)
        if (savedPosition) {
          window.scrollTo({ top: parseInt(savedPosition), behavior: 'smooth' })
        }
      }, 500)
    }
  }
)

// 组件卸载时清除监听
onUnmounted(() => {
  routeParamsChange()
})

// 注入全局状态：是否为夜间模式
const isNight = inject('isNight')
</script>

<style scoped>
/* 文章详情容器样式 */
.article-detail-container {
  background: rgba(133, 153, 199, 0.661);
  position: relative;
  padding: 30px;
  margin: 50px auto;
  max-width: 900px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  /* 过渡动画样式 */
  .article-fade-enter-active,
  .article-fade-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .article-fade-enter-from {
    opacity: 0;
    transform: translateY(20px);
  }
  .article-fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  /* 夜间模式过渡动画 */
  .night-mode & {
    .article-fade-enter-active,
    .article-fade-leave-active {
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .article-fade-enter-from,
    .article-fade-leave-to {
      opacity: 0;
    }
  }
  padding: 30px;
  margin: 50px auto;
  width: 80%;
  max-width: 1000px;
  min-height: auto;
  max-height: 80vh;
  backdrop-filter: blur(15px); /* 磨砂玻璃效果 */
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow-y: auto; /* 允许垂直滚动 */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 文章导航按钮组样式 */
.article-navigation {
  display: flex;
  justify-content: space-between;
  margin: 30px 0;
  gap: 10px;
}

/* 导航按钮样式 */
.nav-button {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 100px;
  max-width: 150px;
}

/* 返回按钮样式 */
.back-button {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 100px;
  max-width: 150px;
  font-weight: bold;
  order: 2; /* 设置返回按钮在中间 */
}

/* 上一篇按钮排序 */
.prev-button {
  order: 1;
}

/* 下一篇按钮排序 */
.next-button {
  order: 3;
}

/* 按钮悬停效果 */
.nav-button:hover, .back-button:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-3px); /* 上移效果 */
}

/* 文章详情样式 */
.article-detail {
  color: #e0e0e0; /* 将文字颜色调暗为浅灰色 */
}

/* 文章标题样式 */
.article-detail h1 {
  font-size: 2.2rem;
  margin-bottom: 15px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* 文章元信息样式 */
.article-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  font-size: 1rem;
  color: #b3c1d6; /* 调整元信息颜色 */
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 文章内容样式 */
.article-content {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 15px;
  line-height: 1.8;
}

.article-content .article-text-content {
  margin-bottom: 20px;
}

/* 文章内容中的图片样式 */
.article-content img {
  max-width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  margin: 15px auto;
  display: block;
  box-sizing: border-box;
}

/* 占位内容样式 */
.placeholder-content {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

/* 文章未找到样式 */
.not-found {
  text-align: center;
  padding: 50px 0;
  color: white;
}

/* 滚动条样式优化 */
.article-detail-container::-webkit-scrollbar {
  width: 8px;
}

.article-detail-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.article-detail-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.article-detail-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 媒体查询适配 - 优化版 */
@media (max-width: 768px) {
  .article-detail-container {
    width: 95%;
    padding: 20px;
    margin: 80px auto 20px; /* 增加上边距，避免标题被遮挡 */
    max-height: 90vh;
    box-sizing: border-box;
  }

  .article-detail h1 {
    font-size: clamp(1.5rem, 5vw, 1.8rem);
  }

  .article-navigation {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .nav-button, .back-button {
    width: auto;
    flex: none;
    padding: 8px 12px;
    margin: 2px;
    font-size: clamp(0.8rem, 3vw, 0.9rem);
  }

  .prev-button, .next-button {
    min-width: 110px;
  }

  .back-button {
    min-width: 80px;
    order: 2;
  }
}

/* 超小屏幕适配 */
@media (max-width: 420px) {
  .article-navigation {
    flex-direction: column;
    align-items: center;
  }

  .nav-button, .back-button {
    width: 100%;
    max-width: 200px;
    margin: 3px 0;
  }

  .prev-button {
    order: 1;
  }

  .back-button {
    order: 2;
  }

  .next-button {
    order: 3;
  }
}
/* 加载动画样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  transition: opacity 0.3s ease;
}

.loading-spinner {
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-spinner p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 1);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 夜间模式样式 */
.night-mode .article-detail-container {
  background: rgba(86, 87, 88, 0.541) !important;
}

.night-mode .placeholder-content {
  background: rgba(60, 60, 70, 0.3) !important;
}

.night-mode .nav-button,
.night-mode .back-button {
  background: rgba(40, 40, 50, 0.5) !important;
}

.night-mode .nav-button:hover,
.night-mode .back-button:hover {
  background: rgba(40, 40, 50, 0.7) !important;
}
</style>
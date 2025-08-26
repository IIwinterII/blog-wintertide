<template>
 <!-- 欢迎文字：根据状态控制显示/隐藏动画 ，精选文章区域-->
  <div 
   class="welcome-container" 
    :class="{ 
     'show': isShowWelcome && !isWelcomeHidden,  // 显示动画
      'hide': isWelcomeHidden                     // 隐藏动画
        }"
         >
          <h1 class="welcome-text-top">Welcome to</h1>
           <h2 class="welcome-text-bottom">wintertide！</h2>
            </div>
             <!-- 下滑提示：引导用户滚动查看内容 -->
              <div 
               class="scroll-indicator" 
               :class="{ 'show': isShowIndicator }"  
              @click="scrollDown">
             <i class="fas fa-chevron-down"></i>
            <p>点击此处或向下滑动</p>
           </div>
          <!-- 文章内容区 -->
  <div class="content" :class="{'visible': isScrolled && !isContentFaded}">
    <div class="articles-container">
      <!-- 搜索结果标题 -->
      <div v-if="isSearchActive" class="search-results-header">
        <h2>搜索结果: "{{ searchKeyword }}" ({{ searchResults.length }})</h2>
        <button class="clear-search" @click="clearSearch">
          <i class="fas fa-times"></i> 清除搜索
        </button>
      </div>

      <!-- 文章卡片列表 -->
      <div class="articles">
        <div 
          v-for="article in (isSearchActive ? searchResults : articles)" 
          :key="article.id" 
          class="article-card" 
          :data-id="article.id" 
          @click="navigateToArticle(article)"
        >
          <h3>{{ article.title }}</h3>
          <p>{{ article.description }}</p>
          <div class="article-meta">
            <span><i class="far fa-calendar"></i> {{ article.publishDate }}</span>
            <span><i class="far fa-user"></i> {{ article.author }}</span>
            <span><i class="far fa-file-alt"></i> {{ article.wordCount || 'N/A' }}字</span>
          </div>
          <div class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="tag" @click.stop="filterByTag(tag)">{{ tag }}</span>
          </div>
        </div>

        <!-- 无搜索结果提示 -->
        <div v-if="isSearchActive && searchResults.length === 0" class="no-results">
          没有找到匹配的文章
        </div>
      </div>
    </div>
  </div>
       </template>
<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits, watch, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios';
// 导入API客户端
import apiClient from '../utils/api.js';





const searchResults = inject('searchResults', ref([]));
const isSearchActive = inject('isSearchActive', ref(false));
const searchKeyword = inject('searchKeyword', ref(''));

const props = defineProps({ isNight: Boolean });
const clearSearch = inject('clearSearch', () => {});

// 按标签筛选文章
const filterByTag = (tag) => {
  // 清除当前搜索
  clearSearch();
  // 设置搜索关键词为标签
  searchKeyword.value = tag;
  // 执行搜索
  performSearch();
}

// 导入performSearch方法
const performSearch = inject('performSearch', () => {});



const isShowWelcome = ref(false);
const isShowIndicator = ref(false);
const isScrolled = ref(false);
const isWelcomeHidden = ref(false);
const isContentFaded = ref(false);
const isScrollingBack = ref(false); // 标识是否从文章返回首页正在滚动中

const router = useRouter()
const route = useRoute() // 添加路由实例
  const articles = ref([]);


const emit = defineEmits({
  showLogin: null,
  showRegister: null
});
   onMounted(async () => {
     try {
       const response = await apiClient.get('/articles');
       // 处理tags为null的情况，并将tags字符串转为数组
       articles.value = response.data.map(article => ({
         ...article,
         tags: article.tags ? article.tags.split(' ') : []
       }));
     } catch (error) {
       console.error('加载文章失败:', error);
     }
   });
// 导航到指定文章
const navigateToArticle = (article) => {
  router.push({ name: 'Article', params: { id: article.id } });
}



// 添加滚动到指定文章的函数
// 控制返回后只滚动一次的标志
let scrollOnceFlag = false;

const scrollToArticle = (id) => {
  // 确保id是数字类型
  const articleId = parseInt(id);
  console.log('尝试滚动到文章ID:', articleId);
  
  // 如果已经滚动过一次，则不再执行
  if (scrollOnceFlag) {
    console.log('已经滚动过一次，不再执行滚动');
    isScrollingBack.value = false;
    return;
  }
  
  // 标记为已滚动
  scrollOnceFlag = true;
  
  // 禁用滚动监听对isContentFaded的影响
  isScrollingBack.value = true;
  
  // 立即显示内容区域
  isScrolled.value = true;
  isWelcomeHidden.value = true;
  isContentFaded.value = false;
  
  // 重试次数计数器
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 300; // 每次重试间隔300ms
  
  // 尝试查找并滚动到文章元素的函数
  const attemptScroll = () => {
    // 使用requestAnimationFrame确保DOM已更新
    requestAnimationFrame(() => {
      // 直接通过ID属性查找文章元素
      const targetArticle = document.querySelector(`.article-card[data-id="${articleId}"]`);
      
      if (targetArticle) {
        console.log('已找到文章元素:', targetArticle);
        const yOffset = -80; // 调整偏移量，确保文章显示在视野中
        const y = targetArticle.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        // 使用scrollIntoView替代window.scrollTo，更可靠地滚动到元素
        targetArticle.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('滚动到文章位置');
        
        // 使用IntersectionObserver检测滚动是否完成
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              console.log('文章元素已进入视口');
              observer.unobserve(targetArticle);
               
              // 滚动完成后，恢复滚动监听对isContentFaded的影响
              setTimeout(() => {
                isScrollingBack.value = false;
                console.log('恢复滚动监听');
              }, 500);
            }
          });
        }, { threshold: 0.5 });
        
        observer.observe(targetArticle);
      } else if (retryCount < maxRetries) {
        // 未找到元素但还有重试次数
        retryCount++;
        console.log(`未找到文章元素，第${retryCount}次重试...`);
        setTimeout(attemptScroll, retryDelay);
      } else {
        // 达到最大重试次数
        console.warn('达到最大重试次数，仍未找到对应的文章元素，ID:', articleId);
        
        // 尝试从数据中查找文章
        const targetArticleData = articles.value.find(article => article.id === articleId);
        if (targetArticleData) {
          console.log('找到了文章数据，但DOM中不存在对应的元素:', targetArticleData.title);
        } else {
          console.warn('文章数据中也未找到ID为', articleId, '的文章');
        }
        
        // 恢复滚动监听
        setTimeout(() => {
          isScrollingBack.value = false;
        }, 1000);
      }
    });
  };
  
  // 开始尝试滚动
  attemptScroll();
}

// 监听路由变化，检查是否需要滚动到指定文章
watch(
  () => route.query.returnToArticleId,
  (newValue) => {
    if (newValue) {
      // 重置滚动一次标志
      scrollOnceFlag = false;
      // 先确保内容可见
      isScrolled.value = true
      isWelcomeHidden.value = true
      isContentFaded.value = false
      // 滚动到指定文章
      scrollToArticle(parseInt(newValue))
      // 清除查询参数
      setTimeout(() => {
        router.replace({ query: {} })
      }, 500);
    }
  },
  { immediate: true } // 初始加载时也检查
)

// 滚动到文章区域
const scrollDown = () => {
  // 延迟执行，确保文章容器已渲染
  setTimeout(() => {
    const articlesContainer = document.querySelector('.articles-container');
    if (articlesContainer) {
      const yOffset = -200; 
      const y = articlesContainer.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth'  });
    } else {
      // 如果文章容器不存在，滚动到页面中间
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, 100);
};

// 滚动事件处理
const handleScroll = () => {
  const scrollY = window.scrollY;
  isScrolled.value = scrollY > 50;
  isWelcomeHidden.value = scrollY > 100;
  isShowIndicator.value = scrollY <= 50;

  // 只有在不是从文章返回的滚动过程中，才更新isContentFaded
  if (!isScrollingBack.value) {
    const isBottom = window.innerHeight + scrollY >= document.body.offsetHeight - 100;
    isContentFaded.value = isBottom;
  }
};

// 组件挂载
onMounted(() => {
  // 延迟显示欢迎文字
  setTimeout(() => isShowWelcome.value = true, 1000);
  // 延迟显示下滑提示
  setTimeout(() => isShowIndicator.value = true, 2000);
  // 绑定滚动事件
  window.addEventListener('scroll', handleScroll);
});

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>

/* 欢迎文字容器样式 */
.welcome-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  z-index: 10;
}

.welcome-container.show {
  opacity: 1;
}

.welcome-container.hide {
  opacity: 0;
}

.welcome-text-top {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.welcome-text-bottom {
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}
/* 欢迎文字容器：居中显示，带动画 */
.welcome-container {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0;
  transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1;
  text-align: center;
  width: 100%;
  max-width: 900px;
  box-sizing: border-box;
  perspective: 1000px; /* 3D效果 */
}/* 欢迎文字样式：带发光效果 */
.welcome-text-top {
  font-size: 4.5rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 
    0 0 5px rgba(255,255,255,0.8),
    0 0 10px rgba(255,255,255,0.6),
    0 0 20px rgba(100, 149, 237, 0.8),
    0 0 40px rgba(100, 149, 237, 0.6);
  letter-spacing: 3px;
  margin: 0 0 10px 0;
  transform-origin: center;
  animation: radialEffect 1.5s ease-out forwards, swing 2s infinite ease-in-out 1.5s;
  opacity: 0;
  position: relative;
  left: -20px;
}
/* 欢迎文字显示动画 */
.welcome-container.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.welcome-text-bottom {
  font-size: 6.5rem;
  font-weight: 700;
  color: #f0f8ff;
  text-shadow: 
    0 0 5px rgba(255,255,255,0.8),
    0 0 10px rgba(255,255,255,0.6),
    0 0 20px rgba(100, 149, 237, 0.8),
    0 0 40px rgba(100, 149, 237, 0.6);
  letter-spacing: 2px;
  margin: 0;
  transform-origin: center;
  animation: radialEffect 1.5s ease-out 0.3s forwards, swing 2s infinite ease-in-out 1.8s;
  opacity: 0;
  position: relative;
  left: 20px;
}
/* 添加媒体查询，调整小屏幕下的文字大小 */
@media (max-width: 768px) {
  .welcome-text-top {
    font-size: 3rem;
  }
  
  .welcome-text-bottom {
    font-size: 4.5rem;
  }
}

@media (max-width: 480px) {
  .welcome-text-top {
    font-size: 2.5rem;
  }
  
  .welcome-text-bottom {
    font-size: 3.5rem;
  }
}
/* 下滑提示样式 */
.scroll-indicator {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease;
  cursor: pointer;
  z-index: 1;
}

/* 下滑提示显示动画 */
.scroll-indicator.show {
  opacity: 1;
  animation: breathe 2s infinite ease-in-out; /* 呼吸效果 */
}

/* 内容区样式：位于视频下方 */
.content {
  position: relative;
  margin-top: 100vh; /* 位于屏幕下方，滚动后可见 */
  padding: 50px;
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 2;
}

.content.visible {
  opacity: 1;
  transition: all 0s cubic-bezier(0.2, 0.8, 0.2, 1);
}


.night-mode .articles-container {
  background: rgba(86, 87, 88, 0.541) !important;
}

.night-mode .search-results-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.night-mode .clear-search {
  background: rgba(220, 53, 69, 0.7);
}

.night-mode .clear-search:hover {
  background: rgba(220, 53, 69, 0.9);
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.search-results-header h2 {
  font-size: 1.8rem;
  margin: 0;
  color: #fff;
}

.clear-search {
  background: rgba(255, 99, 71, 0.7);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.clear-search:hover {
  background: rgba(255, 99, 71, 0.9);
  transform: translateY(-2px);
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
}

.articles-container {
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  max-width: 1200px;
  margin: 0 auto;
}

.articles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-top: 30px;
}

.article-card {
  background: rgba(94, 95, 97, 0.322);
  padding: 25px;
  border-radius: 15px;
  color: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
  transform: translateY(0);
  animation: fadeInUp 0.6s forwards;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
}
.article-card:active {
  transform: translateY(0);
}
.article-card h3 {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: #fff;
}

.article-card p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #e0e1dd;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #a3b1c6;
  margin-bottom: 15px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.tag {
  background: rgba(100, 149, 237, 0.3);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #e6f0ff;
  border: 1px solid rgba(100, 149, 237, 0.5);
}

@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.scroll-indicator.show {
  opacity: 1;
}

.scroll-indicator i {
  font-size: 2rem;
  margin-bottom: 10px;
  animation: bounce 2s infinite;
}
/* 文字摇摆动画 */
@keyframes swing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}



/* 呼吸动画（用于下滑提示） */
@keyframes breathe {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.1);
  }
}

/* 文字径向出现动画 */
@keyframes radialEffect {
  0% {
    transform: scale(0) rotateX(-30deg) rotateY(-30deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.1) rotateX(0) rotateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotateX(0) rotateY(0);
    opacity: 1;
  }
}

/* 欢迎文字隐藏动画 */
.welcome-container.hide {
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 内容区淡出效果 */
.content.fade-out {
  opacity: 1;
  transform: scale(0.95);
  transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

</style>
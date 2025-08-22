<template>
 <!-- 文章详情容器 -->
  <div class="article-detail-container">
   <!-- 文章存在时显示 -->
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
              <!-- 文章内容 -->
               <div class="article-text-content" v-html="article.content"></div>
              <!-- 实际应用中可能需要富文本编辑器生成的内容 -->
             <div class="placeholder-content">
            <p>这是文章的详细内容部分。</p>
           <p>在实际应用中，这里会显示完整的文章内容，包括图片、段落、列表等元素。</p>
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
        <ArticleComments :articleId="article.id" @showLogin="showLogin" />
         </div>
          <!-- 文章不存在时显示 -->
           <div v-else class="not-found">
            <h2>文章未找到</h2>
             <p>抱歉，请求的文章不存在或已被删除。</p>
              <button class="back-button" @click="goBack">
               <i class="fas fa-arrow-left"></i> 返回
                </button>
               </div>
              </div>
             </template>
<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, inject, defineEmits, computed } from 'vue'
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

// 已合并到下方的onMounted钩子函数中
const emit = defineEmits(['showLogin'])
// 当前文章索引
const currentIndex = ref(-1)

// 计算是否有上一篇文章 - 暂时禁用
const hasPrevArticle = computed(() => false)
// 计算是否有下一篇文章 - 暂时禁用
const hasNextArticle = computed(() => false)

// 返回函数
const goBack = () => {
  // 获取当前文章id
  const id = route.params.id
  // 导航回首页，并传递文章id作为查询参数
  router.push({ name: 'Home', query: { returnToArticleId: id } })
}

// 导航到上一篇文章 - 暂时禁用
const navigateToPrev = () => {
  // 后端API支持后实现
}

// 导航到下一篇文章 - 暂时禁用
const navigateToNext = () => {
  // 后端API支持后实现
}

// 显示登录弹窗
const showLogin = () => {
  emit('showLogin')
}

// 组件挂载时执行
onMounted(async () => {
  const id = route.params.id; // 注意：ID是字符串类型
  try {
    const response = await axios.get(`/api/articles/${id}`);
    article.value = response.data; // 仅使用API数据
    // 查找当前文章在数据中的索引 - 暂时注释
    // currentIndex.value = articlesData.findIndex(a => a.id === id)

    // 确保页面滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('加载文章详情失败:', error);
  }
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
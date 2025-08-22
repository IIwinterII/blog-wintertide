<template>
  <!-- 评论组件容器 -->
  <div class="comments-container">
    <!-- 内容包装器，使用网格布局 -->
    <div class="content-wrapper">
     <!-- 左侧公告栏 -->
      <div class="sidebar left-sidebar">
       <div class="panel announcement-panel">
        <h3>公告栏</h3>
         <div class="announcement-item" v-for="(announcement, index) in announcements" :key="index">
          <div class="announcement-date">{{ announcement.date }}</div>
           <div class="announcement-content">{{ announcement.content }}</div>
            </div>
             </div>
              </div>
               <!-- 中间留言板 -->
                <div class="main-content">
                 <h2 style="text-align: center; margin-bottom: 30px; font-size: 2.2rem; color: #fff;">留言板</h2>
                  <!-- 留言表单 -->
                   <div class="comment-form">
                    <h3>发表留言</h3>
                     <div class="form-group">
                      <label for="name">昵称</label>
                       <input type="text" id="name" class="form-control" v-model="newComment.name" placeholder="请输入您的昵称" required>
                        </div>
                         <div class="form-group">
                        <label for="content">留言内容</label>
                       <textarea id="content" class="form-control" v-model="newComment.content" placeholder="请输入您的留言" rows="4" required></textarea>
                      </div>
                     <button class="submit-button" @click="addComment">提交留言</button>
                    </div>
                   <!-- 留言列表 -->
                  <div class="comments-list">
                 <h3>留言列表</h3>
                <div class="comment-item" v-for="(comment, index) in comments" :key="index">
               <div class="comment-header">
              <span class="comment-name">{{ comment.name }}</span>
             <span class="comment-date">{{ comment.date }}</span>
            </div>
           <div class="comment-content">{{ comment.content }}</div>
          </div>
         </div>
        <!-- 返回按钮 -->
        <div class="back-button-container">
          <button class="back-button" @click="goBack">返回</button>
        </div>
       </div>
       <!-- 右侧站点概览 -->
      <div class="sidebar right-sidebar">
     <div class="panel stats-panel">
    <h3>站点概览</h3>
   <div class="stat-item">
  <span class="stat-label">文章总数</span>
 <span class="stat-value">{{ articleCount }}</span>
</div>
 <div class="stat-item">
  <span class="stat-label">分类数量</span>
   <span class="stat-value">{{ categoryCount }}</span>
    </div>
     <div class="stat-item">
      <span class="stat-label">留言数量</span>
       <span class="stat-value">{{ comments.length }}</span>
        </div>
         <div class="stat-item">
          <span class="stat-label">总浏览量</span>
           <span class="stat-value">{{ viewCount }}</span>
            </div>
             </div>
              <div class="panel categories-panel">
               <h3>文章分类</h3>
                <div class="category-item" v-for="(category, index) in categories" :key="index">
               <span class="category-name">{{ category.name }}</span>
              <span class="category-count">({{ category.count }})</span>
             </div>
            </div>
           </div>
          </div>
         </div>
        </template>
<script setup>
// 导入Vue API
import { ref, onMounted, inject } from 'vue';
// 导入路由API
import { useRouter } from 'vue-router';
// 导入文章数据
import { articlesData } from '../data/articles.js';  // 导入文章数据

// 从父组件注入isNight状态（用于夜间模式切换）
const isNight = inject('isNight');

// 创建路由实例
const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};

// 状态变量定义
// 新留言对象
const newComment = ref({ name: '', content: '' });
// 留言列表
const comments = ref([]);

// 公告数据 - 站点重要通知
const announcements = ref([
  { date: '2024-01-15', content: '本站已升级，新增留言板功能！' },
  { date: '2024-01-10', content: '冬季摄影大赛开始征稿，欢迎投稿！' },
  { date: '2023-12-25', content: '祝大家圣诞节快乐，网站将于12月25日-26日维护。' }
]);

// 站点统计数据
const articleCount = ref(articlesData.length);  // 文章总数（从文章数据中获取）
const categoryCount = ref(3);  // 分类数量（硬编码为3）
const viewCount = ref(12500);  // 总浏览量（模拟数据）

// 分类数据 - 文章分类及数量
const categories = ref([
  { name: '摄影技巧', count: 1 },
  { name: '滑雪指南', count: 1 },
  { name: '冬季养生', count: 1 }
]);

// 挂载时加载留言
onMounted(() => {
  // 从本地存储加载留言
  const savedComments = localStorage.getItem('wintertide_comments');
  if (savedComments) {
    comments.value = JSON.parse(savedComments);
  }
});

// 添加留言
const addComment = () => {
  if (!newComment.value.name || !newComment.value.content) {
    alert('请填写完整的留言信息');
    return;
  }

  // 创建新留言对象
  const comment = {
    name: newComment.value.name,
    content: newComment.value.content,
    date: new Date().toLocaleString()
  };

  // 添加到留言列表
  comments.value.unshift(comment);

  // 保存到本地存储
  localStorage.setItem('wintertide_comments', JSON.stringify(comments.value));

  // 清空表单
  newComment.value = { name: '', content: '' };
};
</script>

<style scoped>
.comments-container {
  position: relative;
  min-height: 100vh;
  padding: 120px 20px 50px;
  background: transparent;
  backdrop-filter: blur(15px);
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel {
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.panel h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 10px;
}

.main-content {
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* 公告栏样式 */
.announcement-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.announcement-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.announcement-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
}

.announcement-content {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* 站点概览样式 */
.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

/* 返回按钮样式 */
.back-button-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.back-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #8599c7, #5b6d99);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.back-button:hover {
  background: linear-gradient(135deg, #6d84b4, #4a5d8a);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.back-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* 夜间模式适配 */
.is-night .back-button {
  background: linear-gradient(135deg, #4a5d8a, #323f5e);
}

.is-night .back-button:hover {
  background: linear-gradient(135deg, #3a4b6d, #253147);

  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-weight: 600;
  color: #fff;
}

/* 分类样式 */
.category-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.category-item:hover {
  transform: translateX(5px);
}

.category-name {
  color: rgba(255, 255, 255, 0.9);
}

.category-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

/* 留言板原有样式 */
.comment-form,
.comments-list {
  margin-bottom: 40px;
}

.comment-form h3,
.comments-list h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #fff;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-control:focus {
  outline: none;
  border-color: rgba(100, 149, 237, 0.8);
  background: rgba(255, 255, 255, 0.15);
}

.submit-button {
  padding: 12px 20px;
  background: rgba(65, 90, 119, 0.7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
}

/* 分类样式// 响应式布局 - 根据屏幕尺寸调整布局 */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr 2fr;
  }

  .right-sidebar {
    grid-column: 1 / -1;
    flex-direction: row;
  }

  .panel {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    flex-direction: column;
  }

  .main-content {
    padding: 20px;
  }
}
</style>

<style>
/* 夜间模式样式 - 覆盖默认样式以适应夜间模式 */
.night-mode .comments-container .panel,

.comment-item {
  background: rgba(151, 179, 229, 0.548);
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.comment-name {
  font-weight: 600;
  color: #fff;
}

.comment-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.comment-content {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr 2fr;
  }

  .right-sidebar {
    grid-column: 1 / -1;
    flex-direction: row;
  }

  .panel {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    flex-direction: column;
  }

  .main-content {
    padding: 20px;
  }
}
</style>

<style>
/* 夜间模式样式 */
.night-mode .comments-container .panel,
.night-mode .comments-container .main-content {
  background: rgba(86, 87, 88, 0.541) !important;
  border-color: rgba(100, 100, 100, 0.6) !important;
}

.night-mode .comments-container .comment-item {
  background: rgba(60, 60, 70, 0.3) !important;
  border-color: rgba(100, 100, 100, 0.4) !important;
}

.night-mode .comments-container .form-control {
  background: rgba(60, 60, 70, 0.3) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .comments-container .submit-button {
  background: rgba(40, 40, 40, 0.7) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .comments-container .submit-button:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}

.night-mode .comments-container h2,
.night-mode .comments-container h3,
.night-mode .comments-container .comment-name,
.night-mode .comments-container .stat-value {
  color: #d0d0d0 !important;
}

.night-mode .comments-container .announcement-date,
.night-mode .comments-container .category-count,
.night-mode .comments-container .comment-date,
.night-mode .comments-container .stat-label {
  color: rgba(180, 180, 180, 0.7) !important;
}
</style>
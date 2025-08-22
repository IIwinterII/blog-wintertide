<template>
 <div class="personal-home-container">
  <div class="personal-header">
   <h1>个人主页</h1>
    <div class="user-avatar">
     <i class="fas fa-user-circle"></i>
      </div>
       <div class="user-info">
        <h2>{{ username }}</h2>
         <p>{{ bio }}</p>
          </div>
           </div>
            <div class="personal-content">
             <div class="section">
              <h3><i class="fas fa-book"></i> 我的文章</h3>
               <div v-if="articles.length > 0" class="article-list">
              <div v-for="article in articles" :key="article.id" class="article-item">
             <h4>{{ article.title }}</h4>
            <p>{{ article.summary }}</p>
           </div>
          </div>
         <p v-else class="empty-message">暂无文章</p>
        </div>
       <div class="section">
      <h3><i class="fas fa-heart"></i> 收藏文章</h3>
     <div v-if="favorites.length > 0" class="favorite-list">
    <div v-for="favorite in favorites" :key="favorite.id" class="favorite-item">
   <h4>{{ favorite.title }}</h4>
  </div>
 </div>
<p v-else class="empty-message">暂无收藏</p>
 </div>
  </div>
   <div class="action-buttons" v-if="isLoggedIn">
    <button class="add-article-button" @click="navigateToEditor" v-if="isAdmin">
     <i class="fas fa-plus"></i> 添加文章
      </button>
       <button class="logout-button" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i> 退出登录
         </button>
          </div>
           </div>
            </template>
<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
// 导入用户数据
//import { users } from '../data/users.js';

// 状态变量定义
const router = useRouter();
const isLoggedIn = ref(false);
const isAdmin = ref(false);
const username = ref('未登录用户');
const bio = ref('请登录以查看个人信息');
const articles = ref([]);
const favorites = ref([]);

// 检查本地存储中的登录状态
onMounted(() => {
  const userInfo = localStorage.getItem('user_info');
  if (userInfo) {
    isLoggedIn.value = true;
    const user = JSON.parse(userInfo);
    username.value = user.username || '用户';
    bio.value = user.bio || '这是用户的个人简介';
    // 检查是否为管理员
    isAdmin.value = user.username === 'admin';
    // 模拟加载文章和收藏数据
    loadUserData();
  }
});

// 退出登录方法
const handleLogout = () => {
  // 已登录时执行登出逻辑
  localStorage.removeItem('user_info');
  isLoggedIn.value = false;
  isAdmin.value = false;
  username.value = '未登录用户';
  bio.value = '请登录以查看个人信息';
  articles.value = [];
  favorites.value = [];
  router.push({ name: 'Home' });
};

// 导航到文章编辑器
const navigateToEditor = () => {
  router.push({ name: 'ArticleEditor' });
};
// 模拟加载用户数据
const loadUserData = async () => {
  try {
    // 调用后端 API
    const response = await axios.get('/api/articles');
    articles.value = response.data;
  } catch (error) {
    console.error('加载文章失败:', error);
    articles.value = [
      { id: 1, title: '我的第一篇文章', summary: '测试文章' }
    ];
  }
};
</script>

<style scoped>
.personal-home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: white;
}

.personal-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  font-size: 5rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.user-info h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.user-info p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
}

.section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(133, 153, 199, 0.661);/* 背景颜色 */
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.section h3 i {
  margin-right: 0.8rem;
}

.article-list, .favorite-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.article-item, .favorite-item {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.article-item:hover, .favorite-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.1);
}

.article-item h4, .favorite-item h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.article-item p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.empty-message {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 3rem;
  padding-bottom: 2rem;
}

.add-article-button {
  padding: 0.8rem 1.5rem;
  background: rgba(92, 155, 229, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.add-article-button:hover {
  background: rgba(66, 122, 200, 0.9);
  transform: translateY(-2px);
}

.logout-container {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  padding-bottom: 2rem;
}

.logout-button {
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}


.logout-button:hover {
  background: rgba(133, 153, 199, 0.661);
  transform: translateY(-2px);
}

/* 夜间模式样式 */
/* 与页脚背景一致 */
.night-mode .personal-header {
  background: rgba(86, 87, 88, 0.541) !important;
  border: 1px solid rgba(100, 100, 100, 0.5);
}

.night-mode .section {
  background: rgba(86, 87, 88, 0.541) !important;/* 背景颜色 */
  border: 1px solid rgba(100, 100, 100, 0.5);
}

.night-mode .article-item, .night-mode .favorite-item {
  background: rgba(60, 60, 60, 0.5);
  border: 1px solid rgba(100, 100, 100, 0.3);
}

.night-mode .article-item:hover, .night-mode .favorite-item:hover {
  background: rgba(80, 80, 80, 0.901);
}

/* 与导航栏按钮样式一致 */
.night-mode .logout-button {
  background: rgba(40, 40, 40, 0.7) !important;
  border: 1px solid rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .logout-button:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}

.night-mode .add-article-button {
  background: rgba(50, 80, 120, 0.7) !important;
  border: 1px solid rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .add-article-button:hover {
  background: rgba(70, 100, 140, 0.8) !important;
}
</style>
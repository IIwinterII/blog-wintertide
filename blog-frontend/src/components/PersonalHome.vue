<template>
  <div class="personal page">
    <section class="header wt-card">
      <div class="avatar"><i class="fas fa-user-circle"></i></div>
      <div class="info">
        <h2>{{ username }}</h2>
        <p class="bio">{{ bio }}</p>
      </div>
    </section>

    <section class="section wt-card">
      <h3 class="sec-title"><i class="fas fa-book"></i> 我的文章</h3>
      <div v-if="articles.length" class="grid">
        <article v-for="a in articles" :key="a.id" class="item wt-card wt-card--hover">
          <h4 class="title" @click="router.push({ name: 'Article', params: { id: a.id } })">{{ a.title }}</h4>
          <p class="desc">{{ a.summary }}</p>
          <div class="act" v-if="isAdmin">
            <button class="wt-chip wt-chip--sm" @click="navigateToEditor(a.id)">
              <i class="fas fa-edit"></i> 修改
            </button>
          </div>
        </article>

      </div>
      <p v-else class="empty wt-muted">暂无文章</p>
    </section>

    <section class="section wt-card">
      <h3 class="sec-title"><i class="fas fa-heart"></i> 收藏文章</h3>
      <div v-if="favorites.length" class="grid">
        <article v-for="f in favorites" :key="f.id" class="item wt-card wt-card--hover">
          <h4 class="title">{{ f.title }}</h4>
        </article>
      </div>
      <p v-else class="empty wt-muted">暂无收藏</p>
    </section>
    <div class="bottom-actions">
      <button class="wt-chip wt-chip--sm" @click="router.back()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      <button v-if="isLoggedIn" class="wt-chip wt-chip--sm" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i> 退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isLoggedIn = ref(false);
const isAdmin = ref(false);
const username = ref('未登录用户');
const bio = ref('请登录以查看个人信息');
const articles = ref([]);
const favorites = ref([]);

onMounted(() => {
  const userInfo = localStorage.getItem('user_info');
  if (userInfo) {
    isLoggedIn.value = true;
    const user = JSON.parse(userInfo);
    username.value = user.username || '用户';
    bio.value = user.bio || '这是用户的个人简介';
    isAdmin.value = user.username === 'admin';
    loadUserData();
  }
});

const handleLogout = () => {
  localStorage.removeItem('user_info');
  isLoggedIn.value = false;
  isAdmin.value = false;
  username.value = '未登录用户';
  bio.value = '请登录以查看个人信息';
  articles.value = [];
  favorites.value = [];
  router.push({ name: 'Home' });
};

const navigateToEditor = (articleId = null) => {
  if (articleId) {
    router.push({ name: 'ArticleEditor', params: { id: articleId } });
  } else {
    router.push({ name: 'ArticleEditor' });
  }
};

const loadUserData = async () => {
  try {
    const response = await axios.get('/api/articles');
    articles.value = response.data;
  } catch (error) {
    console.error('加载文章失败:', error);
    articles.value = [
      { id: 1, title: '我的第一篇文章', summary: '测试文章' }
    ];
  }
};

const deleteArticle = async (id) => {
  if (!confirm('确定要删除这篇文章吗？')) return;
  try {
    await axios.delete(`/api/articles/${id}`);
    loadUserData();
  } catch (error) {
    console.error('删除文章失败:', error);
    alert('删除文章失败，请稍后再试');
  }
};
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.personal.page{
  max-width: 1180px;
  margin: 0 auto;
  padding: 120px 16px 40px;
  color: var(--wt-fg);
}

.header{
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;
}

.avatar{
  font-size: 64px;
  color: var(--wt-fg);
  display: grid; place-items: center;
}
.info .bio{ color: var(--wt-fg-weak); margin-top: 4px; }
.ops{ margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }

.section{ margin-top: 16px; padding: 14px; }
.sec-title{ margin: 0 0 8px; display:flex; align-items:center; gap:8px; color: var(--wt-fg); }

.grid{
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px;
}
@media (max-width: 1024px){ .grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 700px){ .grid{ grid-template-columns: 1fr; } }

.item{ padding: 12px; }
.item.add{
  display: grid; place-items: center;
  color: var(--wt-fg);
  gap: 6px; font-weight: 600; cursor: pointer;
}

.title{
  margin: 0 0 4px; font-size: 1.05rem; color: var(--wt-fg);
  cursor: pointer; text-decoration: none;
  transition: transform .2s ease;
}
.title:hover{ transform: translateY(-1px) }

.desc{ color: var(--wt-fg-weak); font-size: .95rem; margin: 0 0 8px; }
.act{ display: flex; gap: 8px; flex-wrap: wrap; }

.empty{ text-align: center; padding: 16px 0 6px; }

.bottom-actions{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 14px 0 0;
}
</style>

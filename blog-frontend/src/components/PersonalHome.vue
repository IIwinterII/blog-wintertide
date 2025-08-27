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
      <div class="grid">
        <article
          v-for="a in articles"
          :key="a.id"
          class="item wt-card wt-card--hover"
          @contextmenu.prevent="onCtxMenu($event, a)"
        >
          <h4 class="title" @click="router.push({ name: 'Article', params: { id: a.id } })">{{ a.title }}</h4>
          <p class="desc">{{ a.summary }}</p>
          <div class="act" v-if="isAdmin">
            <button class="wt-chip wt-chip--sm" @click="navigateToEditor(a.id)">
              <i class="fas fa-edit"></i> 修改
            </button>
            <button class="wt-chip wt-chip--sm danger" @click.stop="askDelete(a.id)">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </article>

        <div v-if="isAdmin" class="item add wt-card wt-card--hover" @click="navigateToEditor()">
          <i class="fas fa-plus"></i>
          <span>增加文章</span>
        </div>

      </div>
      <p v-if="!articles.length" class="empty wt-muted">暂无文章</p>
    </section>

    <section class="section wt-card">
      <h3 class="sec-title"><i class="fas fa-heart"></i> 收藏文章</h3>
      <div v-if="favorites.length" class="grid">
        <article v-for="f in favorites" :key="f.id" class="item wt-card wt-card--hover" @click="router.push({ name: 'Article', params: { id: f.id } })">
          <h4 class="title">{{ f.title }}</h4>
          <div class="act">
            <button class="wt-chip wt-chip--sm" @click.stop="unfavorite(f.id)">
              <i class="fas fa-heart-broken"></i> 取消收藏
            </button>
          </div>
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
    <!-- 右键菜单（仅管理员可见） -->
    <ul
      v-if="isAdmin && ctx.visible"
      class="ctx-menu wt-card"
      :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }"
      @contextmenu.prevent
    >
      <li class="ctx-item" @click="askDelete(ctx.article?.id)">
        <i class="fas fa-trash"></i> 删除
      </li>
    </ul>

    <!-- 二次确认弹窗 -->
    <div v-if="confirm.visible" class="confirm-mask" @click.self="closeConfirm">
      <div class="confirm-dialog wt-card">
        <h3 class="c-title">
          <i class="fas fa-exclamation-triangle"></i>
          {{ confirm.step === 1 ? '确定要删除这篇文章吗？' : '请再次确认删除操作' }}
        </h3>
        <p class="c-desc wt-muted" v-if="confirm.step === 1">
          此操作将永久删除文章，且不可恢复。
        </p>
        <p class="c-desc wt-muted" v-else>
          删除后不可恢复，是否继续？
        </p>
        <div class="c-actions">
          <button class="wt-chip wt-chip--sm" @click="closeConfirm">取消</button>
          <button
            v-if="confirm.step === 1"
            class="wt-chip wt-chip--sm"
            @click="confirm.step = 2"
          >
            继续
          </button>
          <button
            v-else
            class="wt-chip wt-chip--sm danger"
            :disabled="confirm.loading"
            @click="confirmDelete"
          >
            <i class="fas fa-trash"></i> {{ confirm.loading ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isLoggedIn = ref(false);
const isAdmin = ref(false);
const username = ref('未登录用户');
const bio = ref('请登录以查看个人信息');
const articles = ref([]);
const favorites = ref([]);

/* 右键菜单与删除确认状态 */
const ctx = ref({ visible: false, x: 0, y: 0, article: null });
const confirm = ref({ visible: false, step: 1, articleId: null, loading: false });

const onCtxMenu = (e, a) => {
  if (!isAdmin.value) return;
  closeConfirm();
  ctx.value.visible = true;
  // 视口边界处理
  const margin = 8;
  const menuWidth = 160;
  const menuHeight = 46;
  let x = e.clientX;
  let y = e.clientY;
  if (x + menuWidth > window.innerWidth - margin) x = window.innerWidth - menuWidth - margin;
  if (y + menuHeight > window.innerHeight - margin) y = window.innerHeight - menuHeight - margin;
  ctx.value.x = x;
  ctx.value.y = y;
  ctx.value.article = a;
};

const closeCtxMenu = () => { ctx.value.visible = false; ctx.value.article = null; };

const askDelete = (id) => {
  closeCtxMenu();
  if (!id) return;
  confirm.value.visible = true;
  confirm.value.step = 1;
  confirm.value.articleId = id;
};

const closeConfirm = () => {
  confirm.value.visible = false;
  confirm.value.step = 1;
  confirm.value.articleId = null;
  confirm.value.loading = false;
};

const confirmDelete = async () => {
  if (!confirm.value.articleId) return;
  confirm.value.loading = true;
  try {
    await axios.delete(`/api/articles/${confirm.value.articleId}`);
    closeConfirm();
    await loadUserData();
  } catch (error) {
    console.error('删除文章失败:', error);
    closeConfirm();
    alert('删除文章失败，请稍后再试');
  } finally {
    confirm.value.loading = false;
  }
};

/* 全局事件：点击外部/滚动/窗口变化关闭菜单与弹窗 */
const onGlobalClick = (e) => {
  // 若点击在菜单内，不关闭；否则关闭
  const menu = document.querySelector('.ctx-menu');
  if (menu && menu.contains(e.target)) return;
  closeCtxMenu();
};
const onGlobalScroll = () => closeCtxMenu();
const onResize = () => closeCtxMenu();

onMounted(() => {
  const userInfo = localStorage.getItem('user_info');
  if (userInfo) {
    isLoggedIn.value = true;
    const user = JSON.parse(userInfo);
    username.value = user.username || '用户';
    bio.value = user.bio || '这是用户的个人简介';
    const uname = String(user?.username || '').toLowerCase();
    isAdmin.value = Boolean(
      (user && (user.isAdmin === true)) ||
      (user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN' || user.role === 'admin')) ||
      (Array.isArray(user?.roles) && user.roles.some(r => /admin/i.test(String(r)))) ||
      ['admin','winter','wintertide'].includes(uname)
    );
    if (isAdmin.value) {
      loadUserData();
    } else {
      articles.value = [];
    }
  } else {
    articles.value = [];
  }

  window.addEventListener('click', onGlobalClick, { passive: true });
  window.addEventListener('scroll', onGlobalScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('wt-favorites-changed', onFavChanged);
  loadFavorites();
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
  if (!isAdmin.value) { articles.value = []; return; }
  try {
    const response = await axios.get('/api/articles');
    // 过滤掉隐藏文章（id === 1 不显示）
    const list = Array.isArray(response.data) ? response.data : [];
    articles.value = list.filter(it => String(it.id) !== '1');
  } catch (error) {
    console.error('加载文章失败:', error);
    articles.value = [];
  }
};

/* 收藏：读取与事件刷新（按用户隔离 favorites:<username>，未登录为 guest） */
const loadFavorites = async () => {
  try {
    const user = isLoggedIn.value ? username.value : 'guest';
    if (user === 'guest') {
      const list = JSON.parse(localStorage.getItem('favorites:guest') || '[]');
      favorites.value = Array.isArray(list) ? list : [];
      return;
    }
    // 后端收藏
    const res = await axios.get('/api/favorites', { params: { username: user } });
    const arr = Array.isArray(res.data) ? res.data : [];
    favorites.value = arr.map(it => ({ id: it.articleId, title: it.title || `文章 ${it.articleId}` }));
  } catch (e) {
    // 回退到本地，不影响页面
    try {
      const key = `favorites:${isLoggedIn.value ? username.value : 'guest'}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      favorites.value = Array.isArray(list) ? list : [];
    } catch {
      favorites.value = [];
    }
  }
};
const onFavChanged = (e) => {
  const curr = isLoggedIn.value ? username.value : 'guest';
  const who = (e && e.detail && e.detail.user) || curr;
  if (who === curr) loadFavorites();
};

/* 取消收藏：登录走后端接口，未登录修改本地收藏 */
const unfavorite = async (id) => {
  try {
    const user = isLoggedIn.value ? username.value : 'guest';
    if (user === 'guest') {
      const key = 'favorites:guest';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = list.findIndex(it => String(it.id) === String(id));
      if (idx >= 0) list.splice(idx, 1);
      localStorage.setItem(key, JSON.stringify(list));
    } else {
      await axios.delete('/api/favorites', { params: { username: user, articleId: id } });
    }
    window.dispatchEvent(new CustomEvent('wt-favorites-changed', { detail: { user, id, action: 'remove' } }));
    await loadFavorites();
  } catch (e) {
    console.error('取消收藏失败:', e);
    alert('取消收藏失败，请稍后重试');
  }
};

/* 旧 confirm 删除逻辑已被二次确认替代，保留占位以防其他引用 */
const deleteArticle = async (id) => askDelete(id);
onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick);
  window.removeEventListener('scroll', onGlobalScroll);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('wt-favorites-changed', onFavChanged);
});
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

/* 右键菜单 */
.ctx-menu{
  position: fixed;
  min-width: 160px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--wt-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 42px rgba(7,20,35,.38);
  z-index: 3000;
  list-style: none;
  margin: 0;
}
.ctx-item{
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 10px; color: var(--wt-fg);
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
}
.ctx-item:hover{
  background: linear-gradient(145deg, rgba(142,197,255,0.20), rgba(207,232,255,0.12));
  transform: translateY(-1px);
}

/* 二次确认弹窗 */
.confirm-mask{
  position: fixed; inset: 0; z-index: 3500;
  background: rgba(6,12,20,.45); backdrop-filter: blur(3px);
  display: grid; place-items: center;
}
.confirm-dialog{
  width: min(520px, 92%);
  padding: 16px;
}
.c-title{ margin: 0 0 8px; display:flex; align-items:center; gap:8px; }
.c-desc{ margin: 0 0 12px; }
.c-actions{ display:flex; gap:10px; justify-content:flex-end; }
.danger{ background: linear-gradient(145deg, rgba(231,76,60,.90), rgba(231,76,60,.78)); color: #fff; border-color: rgba(231,76,60,.85); }

.bottom-actions{
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 14px 0 0;
}
</style>

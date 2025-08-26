<template>
    <!--雪花特效、日夜间模式以及导航栏-->
  <!-- 引入Font Awesome图标库 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- 根容器：控制夜间模式切换，点击时触发雪花爆炸效果 -->
  <div id="app" :class="{'night-mode': isNight}" @click="handleClickExplosion">
    <!-- 雪花容器：用于展示动态生成的雪花元素 -->
    <div class="snow-container"></div>
     <!-- 添加登录成功提示 -->
     <!-- 登录成功提示 -->
    <div v-if="showLoginSuccess" class="login-success-toast">
      <i class="fas fa-check-circle"></i> 登录成功！
    </div>
     <!-- 添加登录错误提示 -->
     <div v-if="showLoginError" class="login-error-toast">
      <i class="fas fa-exclamation-circle"></i> {{ loginErrorMessage }}
     </div>
    <div class="home-container">
      <!-- 导航栏：根据滚动状态控制显示/固定效果 -->
      <nav class="navbar" :class="{ 
        'visible': isNavbarVisible,  // 控制导航栏是否显示
        'fixed': isNavbarFixed       // 控制导航栏是否固定在顶部
      }">
        <div class="nav-container">
          <!-- 导航按钮组 -->
          <div class="nav-buttons">
          
            <button class="nav-button" @click="goToWelcome">首页</button>
            <button class="nav-button" @click="showLoginModal">登录</button>
            <button class="nav-button" @click="goToArticle">文章</button>
            <button class="nav-button" @click="goToCategory">分类</button>
            <button class="nav-button" @click="scrollToComments">留言</button>
            <button class="nav-button" @click="scrollToAbout">关于</button>
            
          </div>
          
          <!-- 搜索框容器 -->
      <div class="search-container">
        <input type="text" placeholder="搜索文章..." class="search-input" v-model="searchKeyword" @keyup.enter="performSearch">
        <button class="search-button" @click="performSearch">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>

      </nav>
      <!-- 视频背景：两个视频用于切换日夜模式 // 自动播放// 循环播放// 静音（解决自动播放限制）// 移动端内联播放// 控制显示第一个视频-->
      <video 
        ref="video1"
        class="background-video" 
        autoplay 
        loop      
        muted     
        playsinline  
        :class="{ 'active': !videoIndex }" 
        src="@/assets/videos/day/background.mp4"
      >      
      </video>
      <video 
        ref="video2"
        class="background-video" 
        autoplay
        loop 
        muted 
        playsinline
        :class="{ 'active': videoIndex }"  
        src="@/assets/videos/night/background1.mp4"
      ></video>
       <!-- 添加新的回到顶部按钮：放在日夜模式切换按钮上方 -->
      <button class="back-to-top-button" @click="goToTop" :class="{'visible': isShowBackToTop}">
        <i class="fas fa-arrow-up"></i>
       </button>
      <!-- 个人主页/返回按钮：根据当前路由切换图标和功能 -->
      <button class="profile-button" @click="handleProfileOrBack">
        <i class="fas" :class="isOnProfilePage ? 'fa-arrow-left' : 'fa-user'"></i>
      </button>
      <!-- 日夜模式切换按钮：点击切换视频和主题 -->
      <button class="video-switch-button" @click="switchVideo">
        <i class="fas" :class="isNight ?'fa-moon':'fa-sun' "></i>
      </button>
      <!-- 渐变遮罩：增强文字与视频背景的对比度 -->
       <div class="gradient-overlay"></div>
      <!-- 新增：添加Home组件 -->
       <router-view @showLogin="showLogin = true" />
    </div>
    <!-- 登录组件 -->
    <LoginComponent
      :is-night="isNight"
      @login-success="handleLoginSuccess"
      ref="loginComponent"
    />
    <!-- 页脚组件 -->
    <Footer />
 </div>
</template>

<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, onUnmounted, provide, watch } from 'vue';
// 导入视频资源
import dayVideo from "@/assets/videos/day/background.mp4";
import nightVideo from "@/assets/videos/night/background1.mp4";
// 导入组件
import { useRouter } from 'vue-router';  // 确保已导入useRouter
// 导入登录组件和页脚组件
import LoginComponent from './components/LoginComponent.vue';
import Footer from './components/Footer.vue';
// 导入API客户端
import apiClient from './utils/api.js';
// 状态变量定义
const loginComponent = ref(null); // 确保这里初始化为 null
const snowflakes = ref([]);  // 存储雪花元素数据
const maxSnowflakes = 300;   // 最大雪花数量限制
const explosionCount = 20;   // 点击时生成的雪花数量
const snowContainer = ref(null);  // 雪花容器DOM引用
const isNavbarFixed = ref(false);  // 导航栏是否固定
const isNavbarVisible = ref(false);  // 导航栏是否可见
const isNight = ref(false);  // 是否为夜间模式
const video1 = ref(null);  // 第一个视频DOM引用
const video2 = ref(null);  // 第二个视频DOM引用
const videoIndex = ref(0);  // 视频索引（控制显示哪个视频）
const router = useRouter();
const isShowBackToTop = ref(false);  // 控制回到顶部按钮显示/隐藏的状态
const showLoginSuccess = ref(false);  // 登录成功提示状态，删了登录框不刷新
const showLoginError = ref(false);  // 登录错误提示状态
const loginErrorMessage = ref('');  // 登录错误提示消息
const isLoggedIn = ref(false);  // 用户是否已登录
const showLogin = ref(false);  // 控制登录模态框显示
// 搜索相关状态
const searchKeyword = ref('');  // 搜索关键词
const searchResults = ref([]);  // 搜索结果
const isSearchActive = ref(false);  // 搜索是否激活

// 检查本地存储中的登录状态
onMounted(() => {
  const userInfo = localStorage.getItem('user_info');
  if (userInfo) {
    isLoggedIn.value = true;
  }
});
// 视频切换逻辑：切换日夜模式视频
const switchVideo = () => {
  isNight.value = !isNight.value;  // 切换日夜模式状态
  videoIndex.value = videoIndex.value ? 0 : 1;  // 切换视频索引
  
  // 不需要切换视频源，而是通过CSS类控制显示哪个视频
  // 确保两个视频都在播放
  if (video1.value && video1.value.paused) {
    video1.value.play().catch(e => console.log("视频1播放失败:", e));
  }
  if (video2.value && video2.value.paused) {
    video2.value.play().catch(e => console.log("视频2播放失败:", e));
  }
};

// 创建雪花元素
const createSnowflake = (x, y) => {
  // 超过最大数量时移除最旧的雪花
  if (snowflakes.value.length >= maxSnowflakes) {
    const oldestFlake = snowflakes.value.shift();
    oldestFlake.element.remove();
  }

  // 创建雪花DOM元素
  const flake = document.createElement('div');
  flake.classList.add('snowflake');

  // 随机雪花样式（大小、透明度、下落速度等）
  const size = Math.random() * 5 + 2; 
  const opacity = Math.random() * 0.8 + 0.2; 
  const fallDuration = Math.random() * 6 + 4; 
  const wind = (Math.random() - 0.5) * 100; 

  // 设置雪花样式
  flake.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    opacity: ${opacity};
    --wind: ${wind}px; 
    animation: fall ${fallDuration}s linear forwards, sway ${Math.random() * 3 + 2}s ease-in-out infinite alternate;
  `;

  // 添加到容器
  snowContainer.value.appendChild(flake);

  // 存储雪花数据
  const flakeData = {
    element: flake,
    createdAt: Date.now()
  };
  snowflakes.value.push(flakeData);

  // 雪花消失后移除元素
  setTimeout(() => {
    const index = snowflakes.value.findIndex(item => item === flakeData);
    if (index !== -1) {
      snowflakes.value.splice(index, 1);
      flake.remove();
    }
  }, fallDuration * 1000);
};

// 鼠标移动时创建雪花（控制频率避免性能问题）
const handleMouseMove = (e) => {
  if (Date.now() % 5 === 0) {  // 每5毫秒创建一个雪花
    createSnowflake(e.clientX, e.clientY);
  }
};

// 点击时创建爆炸式雪花效果
const handleClickExplosion = (e) => {
  e.stopPropagation();  // 阻止事件冒泡
  // 生成多个雪花，呈放射状分布
  for (let i = 0; i < explosionCount; i++) {
    const angle = Math.random() * Math.PI * 2;  // 随机角度
    const distance = Math.random() * 60;  // 随机距离
    const x = e.clientX + Math.cos(angle) * distance;
    const y = e.clientY + Math.sin(angle) * distance;
    createSnowflake(x, y, true);
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 获取DOM引用
  snowContainer.value = document.querySelector('.snow-container');
  // 初始化两个视频
  if (video1.value) {
    video1.value.src = dayVideo;
    video1.value.play().catch(e => console.log("视频1自动播放失败:", e));
  }
  if (video2.value) {
    video2.value.src = nightVideo;
    video2.value.play().catch(e => console.log("视频2自动播放失败:", e));
  }

  // 延迟显示导航栏（动画效果）
  setTimeout(() => {
    isNavbarVisible.value = true;
  }, 1000);
  // 绑定事件监听
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('click', handleClickExplosion); // 绑定点击事件到window，确保整个页面都能触发雪花爆炸
});
// 组件卸载时清理
onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('click', handleClickExplosion);
  // 清理所有雪花元素
  snowflakes.value.forEach(flake => flake.element.remove());
  snowflakes.value = [];
});
// 滚动事件处理函数（控制页面元素状态）
const handleScroll = () => {
  const scrollY = window.scrollY;
  isNavbarFixed.value = scrollY > 100;
  // 控制回到顶部按钮显示/隐藏
  isShowBackToTop.value = scrollY > 300;
};
// 新增：回到welcome界面函数
const navigateToHome = (scrollToArticles = false) => {
  router.push({ name: 'Home' });
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const homeComponent = document.querySelector('.welcome-container');
    if (homeComponent) {
      homeComponent.classList.add('show');
      homeComponent.classList.remove('hide');
    }
    if (scrollToArticles) {
      setTimeout(() => {
        const articlesContainer = document.querySelector('.articles-container');
        if (articlesContainer) {
          const yOffset = -200;
          const y = articlesContainer.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, 100);
};
// 重构goToWelcome函数
const goToWelcome = () => navigateToHome(false);
// 重构goToArticle函数
const goToArticle = () => navigateToHome(true);
// 导航到分类页面
const goToCategory = () => {
  router.push({ name: 'Category' });
}
// 回到顶部
const goToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 执行搜索
// 执行搜索方法
const performSearch = async () => {
  if (!searchKeyword.value.trim()) {
    // 关键词为空时清空搜索状态
    isSearchActive.value = false;
    searchResults.value = [];
    return;
  }

  try {
    // 从API获取最新文章数据
    const response = await apiClient.get('/articles');
    const allArticles = response.data.map(article => ({
      ...article,
      // 将tags字符串转为数组
      tags: article.tags ? article.tags.split(' ') : []
    }));

    // 执行搜索过滤
    const results = allArticles.filter(article => {
      const titleMatch = article.title?.toLowerCase().includes(searchKeyword.value.toLowerCase());
      const descriptionMatch = article.description?.toLowerCase().includes(searchKeyword.value.toLowerCase());
      const contentMatch = article.content?.toLowerCase().includes(searchKeyword.value.toLowerCase());
      const tagsMatch = article.tags?.some(tag => tag.toLowerCase().includes(searchKeyword.value.toLowerCase()));
      
      return titleMatch || descriptionMatch || contentMatch || tagsMatch;
    });

    // 更新搜索状态
    searchResults.value = results;
    isSearchActive.value = true;
    searchKeyword.value = searchKeyword.value.trim(); // 清除前后空格

    // 跳转到文章区域
    navigateToHome(true);
  } catch (error) {
    console.error('搜索失败:', error);
    // 显示错误提示
    loginErrorMessage.value = '搜索失败，请稍后再试';
    showLoginError.value = true;
    setTimeout(() => showLoginError.value = false, 3000);
  }
};

// 提供登录状态和提示控制函数
provide('isNight', isNight);
provide('showLoginError', showLoginError);
provide('loginErrorMessage', loginErrorMessage);
// 提供搜索状态给子组件
provide('searchResults', searchResults);
provide('isSearchActive', isSearchActive);
provide('searchKeyword', searchKeyword);
// 提供搜索方法
provide('performSearch', performSearch);

// 清除搜索方法
const clearSearch = () => {
  isSearchActive.value = false;
  searchKeyword.value = '';
  searchResults.value = [];
};
// 提供清除搜索方法
provide('clearSearch', clearSearch);
   // App.vue中监听路由变化
   watch(
     () => router.currentRoute.value.query.search,
     (newVal) => {
       if (newVal) {
         searchKeyword.value = newVal;
         performSearch();
       }
     },
     { immediate: true }
   );
   
// 提供显示登录错误提示的函数
provide('showLoginPrompt', (message) => {
  loginErrorMessage.value = message || '请登录';
  showLoginError.value = true;
  setTimeout(() => {
    showLoginError.value = false;
  }, 3000);
});
// 显示登录弹窗
const showLoginModal = () => {
  // 添加检查确保组件引用存在且方法可用
  if (loginComponent.value && typeof loginComponent.value.showLoginModal === 'function') {
    loginComponent.value.showLoginModal();
  } else {
    console.warn('LoginComponent 引用无效或 showLoginModal 方法不存在');
    // 作为备选方案，直接设置 showLogin 为 true
    showLogin.value = true;
  }
}
// 登录成功处理
const handleLoginSuccess = (userData) => {
  // 更新登录状态
  isLoggedIn.value = true;
  // 显示登录成功提示
  showLoginSuccess.value = true;
  // 3秒后自动隐藏提示
  setTimeout(() => {
    showLoginSuccess.value = false;
  }, 3000);
};

// 检测是否在个人主页
const isOnProfilePage = ref(false);

// 监听路由变化
watch(() => router.currentRoute.value.name,
  (newName) => {
    isOnProfilePage.value = newName === 'PersonalHome';
  },
  { immediate: true } // 立即执行一次
);

// 个人主页/返回按钮处理函数
const handleProfileOrBack = () => {
  if (isOnProfilePage.value) {
    // 在个人主页时返回上一页
    router.go(-1);
  } else {
    // 不在个人主页时导航到个人主页
    router.push({ name: 'PersonalHome' });
  }
}


// 滚动到关于区域（页脚）
const scrollToAbout = () => {
  const footerElement = document.querySelector('.site-footer');
  if (footerElement) {
    footerElement.scrollIntoView({ behavior: 'smooth' });  // 平滑滚动到页脚
  }
};

// 修改滚动到留言板方法为导航到Comments组件
const scrollToComments = () => {
  router.push({ name: 'Comments' });
};

</script>


<style>
/* 全局样式变量定义 */
:root {
  --primary-color: #6c7f94;
  --secondary-color: #5f7091;
  --accent-color: #435468;
  --text-light: #e0e1dd;
  --text-dark: #899db3;
  --glass-bg: rgba(194, 200, 212, 0.555);
  --nav-btn-padding: 0.8rem 1.5rem;
  --nav-btn-font: clamp(0.8rem, 1.5vw, 1rem);
  --nav-gap: 0.8rem;
  --frosted-glass: rgba(255, 255, 255, 0.15); /* 磨砂玻璃效果 */
  --transition: all 0.3s ease; /* 统一过渡效果 */
}
/* 内容显示时视频灰度效果 */
.content.visible ~ .background-video {
  filter: grayscale(0.7);
}
/* 移除按钮焦点样式，按钮的黑边 */
button:focus {
  outline: none;
  box-shadow: none;
}
/* 背景视频样式：全屏覆盖 */
.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover; /* 保持比例填充屏幕 */
  z-index: -1; /* 位于最底层 */
  transition: filter 0.5s ease;
}
/* 渐变遮罩：增强文字可读性 */
.gradient-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0.3) 0%,
    rgba(255,255,255,0) 30%,
    rgba(255,255,255,0) 70%,
    rgba(255,255,255,0.3) 100%
  );
  pointer-events: none;
  z-index: 0;
}
/* 导航栏漂浮动画 */
@keyframes navbarFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
/* 导航栏样式：顶部固定，带渐变背景 */
.navbar {
  position: fixed;
  top: -100px; /* 默认隐藏 */
  left: 0;
  width: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0.3) 0%,
    rgba(255,255,255,0) 100%
  );
  padding: 10px 0;
  z-index: 1000;
  transition: top 1s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.5s ease, backdrop-filter 0.5s ease;
  animation: navbarFloat 3s ease-in-out infinite 2s; /* 漂浮效果 */
}

/* 导航栏固定状态样式：磨砂玻璃效果 */
.navbar.fixed {
  background: var(--frosted-glass);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 15px rgba(225, 231, 240, 0.366);
}

/* 导航栏显示状态 */
.navbar.visible {
  top: 0;
}
/* 导航容器：弹性布局，删了搜索栏 跑下面*/
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap; /* 支持换行 */
}

/* 导航按钮组，控制导航栏上下间距 */
.nav-buttons {
  padding: var(--nav-btn-padding);
  font-size: var(--nav-btn-font);
  display: flex;
  gap: var(--nav-gap);
  flex: 1;
  justify-content: flex-start;
}

/* 导航左边4按钮样式 */
.nav-button {
  padding: clamp(8px, 3vw, 10px) clamp(12px, 4vw, 20px);
  background: transparent;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 20px;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  gap: var(--nav-gap);
  white-space: nowrap;
}

/* 导航按钮悬停效果 */
.nav-button:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}
/* 移除移动端点击高亮 */
.nav-button {
  -webkit-tap-highlight-color: transparent; 
}
/* 搜索框容器 */
.search-container {
  display: flex;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(5px);
  height: 100%;
}

/* 搜索输入框 */
.search-input {
  padding: 0.8rem 1rem;
  font-size: clamp(0.8rem, 1.5vw, 1rem);
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.9);
  outline: none;
  width: 250px;
  transition: width 0.3s ease;
}

.search-input:focus {
  width: 300px;
}

/* 搜索结果样式 */
.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.search-results-header h2 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
}

.clear-search {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.clear-search:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.no-results {
  text-align: center;
  color: white;
  padding: 20px;
  font-size: 1.2rem;
}

/* 夜间模式搜索结果样式 */
.night-mode .search-results-header h2,
.night-mode .no-results {
  color: #e0e0e0;
}

.night-mode .clear-search {
  background-color: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.night-mode .clear-search:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 搜索按钮（白色） */
.search-button {
  padding: 10px 15px;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255,255,255,0.7);
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  background: rgba(255,255,255,0.3);
}

/* 搜索框占位符样式 */
.search-input::placeholder {
  color: rgba(255,255,255,0.7);
}

/* 回到顶部按钮样式 */
.back-to-top-button {
  position: fixed;
  bottom: 136px;
  right: 30px;
  width:  clamp(36px, 5vw, 48px); 
  height: clamp(36px, 5vw, 48px);
  border-radius: 50%;
  background: transparent;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.7);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: navbarFloat 3s ease-in-out infinite;
  transition: all 0.3s ease;
  margin-right: 10px;
  opacity: 0; /* 添加初始透明度为0 */
  transform: translateY(20px); /* 添加初始位移 */
}
/* 回到顶部按钮显示状态 */
.back-to-top-button.visible {
  opacity: 1;
  transform: translateY(0);
}

/* 回到顶部按钮悬停效果 */
.back-to-top-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* 视频切换按钮样式 */
.video-switch-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width:  clamp(36px, 5vw, 48px); 
  height: clamp(36px, 5vw, 48px);
  border-radius: 50%;
  background: transparent;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.7);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: navbarFloat 3s ease-in-out infinite;
  transition: all 0.3s ease;
  margin-right: 10px;
}

/* 切换按钮悬停效果 */
.video-switch-button:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}

/* 视频背景样式 */
.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0;
  transition: opacity 1s ease;
}

/* 活动视频样式 */
.background-video.active {
  opacity: 1;
}
/* 个人主页按钮样式 */
.profile-button {
  position: fixed;
  bottom: 83px;  /* 位于日夜模式按钮上方 */
  right: 30px;
  width:  clamp(36px, 5vw, 48px); 
  height: clamp(36px, 5vw, 48px);
  border-radius: 50%;
  background: transparent;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.7);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: navbarFloat 3s ease-in-out infinite;
  transition: all 0.3s ease;
  margin-right: 10px;
}

/* 个人主页按钮悬停效果 */
.profile-button:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}
/* 主页按钮悬停效果 */
.home-button:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}
/* 主容器样式 */
.home-container {
  position: relative;
  overflow: hidden;
  min-height: auto;
  height: auto;
}
/* 雪花下落动画 */
@keyframes fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--wind, 0px), 100vh) rotate(360deg);
    opacity: 0;
  }
}
/* 雪花左右摇摆动画 */
@keyframes sway {
  0% {
    transform: translateX(-20px);
  }
  100% {
    transform: translateX(20px);
  }
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 雪花容器样式：全屏覆盖，不影响鼠标交互 */
.snow-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 确保雪花不遮挡点击 */
  z-index: 999; /* 显示在所有内容上方 */
}

/* 雪花样式：白色圆形 */
.snowflake {
  position: absolute;
  background-color: white;
  border-radius: 50%;
  filter: blur(0.5px); /* 轻微模糊更像雪花 */
}


/* 夜间模式全局样式 */
.night-mode {
  color: #a09e9e7e; /* 文字浅灰色 */
}

/* 夜间模式按钮样式调整 */
.night-mode .nav-button,
.night-mode .search-button,
.night-mode .submit-button,
.night-mode .close-button,
.night-mode .video-switch-button,
.night-mode .back-to-top-button{
  background: rgba(40, 40, 40, 0.7) !important;
  border: 1px solid rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

/* 夜间模式边框和文字颜色调整 */
.night-mode .nav-button,
.night-mode .search-container{
  border-color: rgba(100, 100, 100, 0.6) !important;
}

/* 夜间模式按钮悬停效果 */
.night-mode .nav-button:hover,
.night-mode .search-button:hover,
.night-mode .submit-button:hover,
.night-mode .video-switch-button:hover,
.night-mode .back-to-top-button:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}
/* 夜间模式时，为搜索容器添加一个1像素宽、半透明灰色的边框 */
.night-mode .search-container {
  border: 1px solid rgba(100, 100, 100, 0.5) !important;
}

/* 夜夜间模式下设置搜索输入框的文本颜色 */
.night-mode .search-input {
  color: rgba(220, 220, 220, 0.9) !important;
}

/* 夜深色背景下仍然保持良好的可读性 */
.night-mode .search-input::placeholder {
  color: rgba(180, 180, 180, 0.7) !important;
}

/* 夜间模式视频亮度降低 */
.night-mode .background-video {
  filter: brightness(0.7);
}
/* 夜间模式提示框样式调整 */
.night-mode .login-success-toast {
  background-color: rgba(39, 174, 96, 0.9);
}

.night-mode .login-error-toast {
  background-color: rgba(192, 57, 43, 0.9);
}
/* 夜间模式下个人主页按钮样式 */
.night-mode .profile-button {
  background: rgba(40, 40, 40, 0.7) !important;
  border: 1px solid rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

/* 夜间模式下个人主页按钮悬停效果 */
.night-mode .profile-button:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}

/* 响应式布局：中等屏幕 */
@media (max-width: 900px) {
  .nav-container {
    flex-direction: column; /* 垂直布局 */
    gap: 1rem;
    padding: 0rem;
  }
  
  .nav-buttons, .search-container {
    width: 100%;
    max-width: 100%;
    justify-content: space-around;
  }
  
  .search-container {
    margin: 0rem 0;
  }
}
/* 响应式布局：小屏幕 */
@media (max-width: 480px) {
  .nav-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.75rem;
  }
  
  .search-input {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
  
  /* 小屏幕导航按钮组优化 */
  .nav-buttons {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .search-container {
    width: 90%;
    margin: 0.5rem auto;
  }
}
/* 全局登录提示基础样式（夜间模式在下方已有覆盖） */
.login-success-toast,
.login-error-toast {
  position: fixed;
  top: 80px;
  right: 30px;
  padding: 10px 16px;
  border-radius: 8px;
  color: #fff;
  backdrop-filter: blur(6px);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
.login-success-toast {
  background-color: rgba(46, 204, 113, 0.9);
}
.login-error-toast {
  background-color: rgba(231, 76, 60, 0.9);
}
</style>

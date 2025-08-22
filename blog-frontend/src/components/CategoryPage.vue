<template>
  <div class="category-page">
    <div class="container">
      <div class="category-header">
        <h1>文章分类</h1>
        <div class="category-tabs">
          <button :class="{ active: activeTab === 'time' }" @click="switchTab('time')">时间</button>
          <button :class="{ active: activeTab === 'category' }" @click="switchTab('category')">类别</button>
          <button :class="{ active: activeTab === 'rank' }" @click="switchTab('rank')">排行</button>
          <div v-if="activeTab === 'rank'" class="rank-subtabs">
            <button :class="{ active: rankType === 'views' }" @click="switchRankType('views')">热度排行</button>
            <button :class="{ active: rankType === 'wordCount' }" @click="switchRankType('wordCount')">字数排行</button>
          </div>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="main-content">
          <!-- 时间归档视图 -->
          <div v-if="activeTab === 'time'" class="timeline-archive">
            <div v-for="(yearGroup, year) in timeGroupedArticles" :key="year" class="year-group">
              <h2 class="year-title">{{ year }}</h2>
              <div v-for="(monthGroup, month) in yearGroup" :key="month" class="month-group">
                <h3 class="month-title">{{ getMonthName(month) }}</h3>
                <ul class="article-list">
                  <li v-for="article in monthGroup" :key="article.id" class="article-item">
                    <div class="article-date">{{ formatDate(article.date) }}</div>
                    <div class="article-content">
                      <router-link :to="{ name: 'Article', params: { id: article.id } }" class="article-title">{{ article.title }}</router-link>
                      <div class="article-meta">
                        <span class="article-views"><i class="fas fa-eye"></i> {{ article.views }}</span>
                        <span class="article-words"><i class="fas fa-file-alt"></i> {{ article.wordCount }}字</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 分类视图 -->
          <div v-else-if="activeTab === 'category'" class="category-view">
            <div class="category-list">
              <button
                v-for="tag in allTags"
                :key="tag"
                :class="{ active: activeCategory === tag }"
                @click="switchCategory(tag)"
              >
                {{ tag }}
                <span class="tag-count">({{ getTagCount(tag) }})</span>
              </button>
            </div>
            <ul class="article-list">
              <li v-for="article in filteredArticles" :key="article.id" class="article-item">
                <div class="article-date">{{ formatDate(article.date) }}</div>
                <div class="article-content">
                  <router-link :to="{ name: 'Article', params: { id: article.id } }" class="article-title">{{ article.title }}</router-link>
                  <div class="article-meta">
                    <span class="article-views"><i class="fas fa-eye"></i> {{ article.views }}</span>
                    <span class="article-words"><i class="fas fa-file-alt"></i> {{ article.wordCount }}字</span>
                  </div>
                  <div class="article-tags">
                    <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- 排行视图 -->
          <div v-else-if="activeTab === 'rank'" class="rank-view">
            <ul class="article-list">
              <li v-for="(article, index) in rankedArticles" :key="article.id" class="article-item">
                <div class="rank-number">{{ index + 1 }}</div>
                <div class="article-content">
                  <router-link :to="{ name: 'Article', params: { id: article.id } }" class="article-title">{{ article.title }}</router-link>
                  <div class="article-meta">
                    <span v-if="rankType === 'views'" class="article-views"><i class="fas fa-eye"></i> {{ article.views }}</span>
                    <span v-if="rankType === 'wordCount'" class="article-words"><i class="fas fa-file-alt"></i> {{ article.wordCount }}字</span>
                  </div>
                  <div class="article-tags">
                    <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="sidebar">
          <div class="widget">
            <h3>热门标签</h3>
            <div class="tag-cloud">
              <span
                v-for="tag in allTags"
                :key="tag"
                :style="{ fontSize: `${14 + getTagCount(tag) * 0.5}px` }"
                class="cloud-tag"
                @click="switchTab('category'); switchCategory(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="widget">
            <h3>文章统计</h3>
            <ul class="stat-list">
              <li class="stat-item">总文章数: {{ articles.length }}</li>
              <li class="stat-item">总浏览量: {{ totalViews }}</li>
              <li class="stat-item">总字数: {{ totalWords }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { articlesData } from '../data/articles';

const router = useRouter();

// 状态管理
const activeTab = ref('time'); // time, category, rank
const activeCategory = ref('全部');
const rankType = ref('views'); // views, wordCount
const articles = ref([]);
const allTags = ref(['全部']);

// 初始化数据
onMounted(() => {
  // 加载文章数据
  articles.value = [...articlesData];

  // 提取所有标签
  const tagsSet = new Set();
  articles.value.forEach(article => {
    article.tags.forEach(tag => tagsSet.add(tag));
  });
  allTags.value = ['全部', ...Array.from(tagsSet)];

  // 默认激活第一个分类
  activeCategory.value = allTags.value[0];
});

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab;
};

// 切换分类
const switchCategory = (category) => {
  activeCategory.value = category;
};

// 切换排行类型
const switchRankType = (type) => {
  rankType.value = type;
};

// 按时间分组的文章
const timeGroupedArticles = computed(() => {
  const groups = {};

  articles.value.forEach(article => {
    const date = new Date(article.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    if (!groups[year]) {
      groups[year] = {};
    }
    if (!groups[year][month]) {
      groups[year][month] = [];
    }
    groups[year][month].push(article);
  });

  // 按年份降序排序
  const sortedGroups = {};
  Object.keys(groups).sort((a, b) => b - a).forEach(year => {
    sortedGroups[year] = groups[year];

    // 按月份降序排序
    const sortedMonths = {};
    Object.keys(sortedGroups[year]).sort((a, b) => b - a).forEach(month => {
      sortedMonths[month] = sortedGroups[year][month];
    });
    sortedGroups[year] = sortedMonths;
  });

  return sortedGroups;
});

// 筛选后的文章
const filteredArticles = computed(() => {
  if (activeCategory.value === '全部') {
    return articles.value.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    return articles.value
      .filter(article => article.tags.includes(activeCategory.value))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }
});

// 排行文章
const rankedArticles = computed(() => {
  return [...articles.value].sort((a, b) => {
    if (rankType.value === 'views') {
      return b.views - a.views;
    } else {
      return b.wordCount - a.wordCount;
    }
  });
});

// 获取标签数量
const getTagCount = (tag) => {
  if (tag === '全部') {
    return articles.value.length;
  }
  return articles.value.filter(article => article.tags.includes(tag)).length;
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
};

// 获取月份名称
const getMonthName = (month) => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return months[month - 1];
};

// 统计数据
const totalViews = computed(() => {
  return articles.value.reduce((sum, article) => sum + article.views, 0);
});

const totalWords = computed(() => {
  return articles.value.reduce((sum, article) => sum + article.wordCount, 0);
});
</script>

<style scoped>
.category-page {
  padding: 2rem 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 50px;
  margin-bottom: 50px;
}

.category-header {
  margin-bottom: 2rem;
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.category-header h1 {
  font-size: 2.5rem;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  margin-bottom: 1rem;
}

.category-tabs {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.category-tabs button {
  padding: 0.5rem 1rem;
  margin: 0 0.5rem 0.5rem 0;
  background-color: #f0f0f0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.category-tabs button:hover:not(.active) {
  background-color: #e6e6e6;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.category-tabs button.active {
  background-color: #4a6cf7;
  color: white;
}

.rank-subtabs {
  display: flex;
  margin-top: 0.5rem;
  width: 100%;
  justify-content: center;
}

.rank-subtabs button {
  margin: 0 0.5rem;
}

.content-wrapper {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}

.main-content {
  flex: 1;
  min-width: 0;
  background: rgba(94, 95, 97, 0.322);
  backdrop-filter: blur(8px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

/* 时间归档样式 */
.timeline-archive {
  position: relative;
  padding-left: 2rem;
  padding-top: 1rem;
}

/* 侧边栏组件样式 */
.widget {
  background: rgba(94, 95, 97, 0.322);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.widget h3 {
  margin-top: 0;
  border-bottom: 2px solid #6a85e7;
  padding-bottom: 0.5rem;
  color: #fff;
  font-size: 1.3rem;
}

.timeline-archive::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e0e0e0;
  transform: translateX(-50%);
}

.year-title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  position: relative;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: 700;
}

.year-title::before {
  content: '';
  position: absolute;
  left: -2rem;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #4a6cf7;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(74, 108, 247, 0.6);
}

.month-title {
  font-size: 1.3rem;
  margin: 1.5rem 0 0.8rem;
  color: #f0f0f0;
  padding-left: 0.5rem;
  border-left: 3px solid #4a6cf7;
  font-weight: 600;
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  padding: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  position: relative;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.article-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.article-item:last-child {
  border-bottom: none;
}

.article-date {
  width: 80px;
  flex-shrink: 0;
  color: #e0e0e0;
  font-size: 0.9rem;
  text-align: right;
  padding-right: 1rem;
}

.article-content {
  flex: 1;
  min-width: 0;
}

.article-title {
  display: block;
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  padding-bottom: 2px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.article-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background-color: #6a85e7;
  transition: width 0.3s ease;
}

.article-title:hover {
  color: #6a85e7;
  transform: translateX(3px);
}

.article-title:hover::after {
  width: 100%;
}

.article-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #e0e0e0;
  margin-top: 0.3rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 12px;
}

.article-meta i {
  margin-right: 0.3rem;
}

.article-tags {
  margin-top: 0.3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.7rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  color: #ffffff;
  transition: all 0.3s ease;
}

.tag:hover {
  background: rgba(202, 210, 240, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(106, 133, 231, 0.2);
}

/* 分类视图样式 */
.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  padding: 1rem 0;
}

.category-list button {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  color: #f0f0f0;
}

.category-list button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.category-list button.active {
  background: rgba(255, 255, 255, 0.9);
  color: #333333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.tag-count {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
  color: #333333;
}

/* 排行视图样式 */
.rank-number {
  width: 35px;
  height: 35px;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.article-item:hover .rank-number {
  transform: scale(1.1);
}

/* 前三名使用不同颜色 */
.article-item:nth-child(1) .rank-number {
  background: linear-gradient(135deg, #ffd700, #ffb700);
}

.article-item:nth-child(2) .rank-number {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
}

.article-item:nth-child(3) .rank-number {
  background: linear-gradient(135deg, #cd7f32, #b35c22);
}

.article-item:nth-child(n+4) .rank-number {
  background: linear-gradient(135deg, #4a6cf7, #3a56d4);
}

/* 侧边栏样式 */
.widget {
  background: rgba(94, 95, 97, 0.4);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.widget h3 {
  margin-top: 0;
  border-bottom: 2px solid #4a6cf7;
  padding-bottom: 0.5rem;
  color: #fff;
  font-size: 1.3rem;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cloud-tag {
  cursor: pointer;
  padding: 0.3rem 0.7rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  color: #333333;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.cloud-tag:hover {
  background: rgba(255, 255, 255, 1);
  color: #333333;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.stat-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stat-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  font-weight: 500;
}

.stat-item:last-child {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .timeline-archive {
    padding-left: 1.5rem;
  }

  .article-date {
    width: 70px;
    padding-right: 0.5rem;
  }
}

@media (max-width: 576px) {
  .category-tabs {
    flex-direction: column;
    align-items: center;
  }

  .category-tabs button {
    width: 100%;
    margin-right: 0;
  }

  .article-item {
    flex-direction: column;
  }

  .article-date {
    width: 100%;
    text-align: left;
    padding-right: 0;
    margin-bottom: 0.5rem;
  }
}
/* 夜间模式样式 */
.night-mode .container {
  background: rgba(86, 87, 88, 0.541) !important;
}

.night-mode .main-content,
.night-mode .widget {
  background: rgba(60, 60, 70, 0.3) !important;
}

.night-mode .category-tabs button,
.night-mode .category-list button {
  background: rgba(40, 40, 50, 0.5) !important;
}

.night-mode .category-tabs button.active,
.night-mode .category-list button.active {
  background: rgba(74, 108, 247, 0.6) !important;
}

.night-mode .cloud-tag,
.night-mode .tag {
  background: rgba(74, 108, 247, 0.2) !important;
  border-color: rgba(74, 108, 247, 0.4) !important;
}

.night-mode .article-title {
  color: #e0e0e0 !important;
}

.night-mode .article-meta,
.night-mode .stat-item {
  color: #a0a0a0 !important;
}
</style>
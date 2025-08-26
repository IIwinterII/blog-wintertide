<template>
 <!-- 文章评论组件容器 -->
  <div class="article-comments">
   <!-- 评论标题 -->
    <h3 class="comments-title">评论区</h3>
     <!-- 登录提示：未登录状态显示 -->
      <div v-if="!isLoggedIn" class="login-prompt wt-card wt-card--icecut">
       <p>请先登录后再发表评论</p>
         </div>
          <!-- 评论表单：登录状态显示 -->
           <div v-else class="comment-form wt-card wt-card--icecut">
            <div class="form-group">
             <label for="comment-content">发表评论</label>
              <!-- 评论内容输入框，双向绑定到newComment.content -->
               <textarea id="comment-content" class="form-control" v-model="newComment.content"
              placeholder="请输入您的评论" rows="3" required></textarea>
             </div>
            <!-- 提交评论按钮 -->
           <button class="submit-button wt-chip" @click="addComment" :disabled="isLoading">
             <span v-if="isLoading">提交中...</span>
             <span v-else>提交评论</span>
           </button>
          </div>
          <!-- 错误信息 -->
          <div v-if="error" class="error-message">{{ error }}</div>
         <!-- 评论列表 -->
        <div class="comments-list">
       <!-- 加载中 -->
       <div v-if="isLoading" class="loading-comments">
         <p>加载中...</p>
       </div>
       <!-- 无评论提示 -->
      <div v-else-if="comments.length === 0" class="no-comments">
     <p>暂无评论，快来发表第一条评论吧！</p>
    </div>
   <!-- 评论项：循环渲染所有评论 -->
  <div v-else class="comment-item wt-card wt-card--icecut wt-sheen" v-for="(comment, index) in comments" :key="index">
 <div class="comment-header">
<!-- 评论用户名称 -->
 <span class="comment-name">{{ comment.username }}</span>
  <!-- 评论日期 -->
   <span class="comment-date">{{ formatDate(comment.createTime) }}</span>
    </div>
     <!-- 评论内容 -->
      <div class="comment-content">{{ comment.content }}</div>
       </div>
        </div>
         </div>
          </template>

<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, inject, defineProps, defineEmits } from 'vue';
// 导入评论API
import { getCommentsByArticleId, addComment as apiAddComment } from '../utils/api';

// 定义组件属性：接收文章ID
const props = defineProps({ articleId: String });
const emit = defineEmits(['posted', 'loaded']);
// 状态变量：用户登录状态
const isLoggedIn = ref(false);
// 状态变量：新评论内容
const newComment = ref({ content: '' });
// 状态变量：评论列表
const comments = ref([]);
// 状态变量：加载状态
const isLoading = ref(false);
// 状态变量：错误信息
const error = ref('');
// 注入全局状态：是否为夜间模式
const isNight = inject('isNight');

// 格式化日期函数
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// 生命周期钩子：组件挂载时执行
onMounted(() => {
  // 检查用户登录状态（使用正确的localStorage键）
    const user = JSON.parse(localStorage.getItem('user_info'));
    isLoggedIn.value = !!user;

  // 加载评论
  fetchComments();
});

// 方法：获取文章评论
const fetchComments = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    // 确保传递数字类型的ID
    const response = await getCommentsByArticleId(Number(props.articleId));
    comments.value = response.data;
    emit('loaded', comments.value.length);
  } catch (err) {
    if (err.response?.status === 403) {
      error.value = '后端服务正在启动中，请稍后重试';
    } else {
      error.value = '获取评论失败，请重试';
    }
    console.error('Failed to fetch comments:', err);
  } finally {
    isLoading.value = false;
  }
};

// 方法：添加新评论
const addComment = async () => {
  // 验证评论内容是否为空
  if (!newComment.value.content.trim()) {
    alert('请输入评论内容');
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    // 获取用户信息（使用正确的localStorage键）
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (!user) {
      alert('请先登录');
      return;
    }

    // 创建评论对象（与后端契约对齐）
    const payload = {
      articleId: Number(props.articleId),
      content: newComment.value.content,
      username: user.username,
      userId: Number(user.id ?? user.userId)
    };

    // 调用API添加评论
    const response = await apiAddComment(payload);
    if (response && (response.status === 200 || response.status === 201)) {
      // 添加成功，重新加载评论
      await fetchComments();
      // 清空输入框
      newComment.value.content = '';
      // 通知父级（用于刷新“留言数量”等）
      emit('posted', comments.value.length);
    } else {
      error.value = (response && response.data && response.data.message) || '添加评论失败';
    }
  } catch (err) {
    error.value = '添加评论失败，请重试';
    console.error('Failed to add comment:', err);
  } finally {
    isLoading.value = false;
  }
};

</script>

<style scoped>
/* 评论区容器样式 */
.article-comments {
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1); /* 顶部分隔线 */
}

/* 评论标题样式 */
.comments-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #fff;
}

/* 登录提示样式 */
.login-prompt {
  text-align: center;
  padding: 20px 16px;
  margin-bottom: 20px;
}

.login-prompt p {
  margin-bottom: 15px;
  color: rgba(255, 255, 255, 0.8);
}



/* 评论表单样式 */
.comment-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
}

/* 表单输入框样式 */
.form-control {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.1); /* 半透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: rgba(100, 149, 237, 0.8); /* 聚焦时边框变色 */
  background: rgba(255, 255, 255, 0.15);
}

/* 提交按钮样式 */
.submit-button {
  background: transparent;
  border: none;
  padding: 0;
}

.submit-button:hover {
  transform: translateY(-2px); /* 悬停时上移效果 */
}

/* 提交按钮禁用状态样式 */
.submit-button:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
}

/* 错误信息样式 */
.error-message {
  padding: 12px 15px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 10px;
  color: #dc3545;
  margin-bottom: 15px;
}

/* 加载中样式 */
.loading-comments {
  text-align: center;
  padding: 20px 0;
  color: rgba(255, 255, 255, 0.7);
}

/* 评论列表样式 */
.comments-list {
  margin-top: 30px;
}

/* 无评论提示样式 */
.no-comments {
  text-align: center;
  padding: 30px 0;
  color: rgba(255, 255, 255, 0.7);
}

/* 评论项样式 */
.comment-item {
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 15px;
  position: relative;
}

/* 评论头部样式 */
.comment-header {
  display: flex;
  justify-content: space-between; /* 两端对齐布局 */
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* 底部分隔线 */
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
  line-height: 1.6; /* 行高 */
}
</style>

<style>
/* 夜间模式样式 */
.night-mode .article-comments .comment-item {
  background: rgba(60, 60, 70, 0.3) !important; /* 夜间模式下评论项背景 */
}

.night-mode .article-comments .login-prompt {
  background: rgba(60, 60, 70, 0.3) !important; /* 夜间模式下登录提示背景 */
}

.night-mode .article-comments .form-control {
  background: rgba(60, 60, 70, 0.3) !important; /* 夜间模式下表单输入框背景 */
}

/* 夜间模式错误信息样式 */
.night-mode .article-comments .error-message {
  background: rgba(220, 53, 69, 0.1) !important;
  border-color: rgba(220, 53, 69, 0.2) !important;
}

/* 夜间模式提交按钮禁用状态 */
.night-mode .article-comments .submit-button:disabled {
  background: rgba(108, 117, 125, 0.3) !important;
}
</style>
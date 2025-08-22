<template>
 <!-- 文章评论组件容器 -->
  <div class="article-comments">
   <!-- 评论标题 -->
    <h3 class="comments-title">评论区</h3>
     <!-- 登录提示：未登录状态显示 -->
      <div v-if="!isLoggedIn" class="login-prompt">
       <p>请先登录后再发表评论</p>
         </div>
          <!-- 评论表单：登录状态显示 -->
           <div v-else class="comment-form">
            <div class="form-group">
             <label for="comment-content">发表评论</label>
              <!-- 评论内容输入框，双向绑定到newComment.content -->
               <textarea id="comment-content" class="form-control" v-model="newComment.content"
              placeholder="请输入您的评论" rows="3" required></textarea>
             </div>
            <!-- 提交评论按钮 -->
           <button class="submit-button" @click="addComment">提交评论</button>
          </div>
         <!-- 评论列表 -->
        <div class="comments-list">
       <!-- 无评论提示 -->
      <div v-if="comments.length === 0" class="no-comments">
     <p>暂无评论，快来发表第一条评论吧！</p>
    </div>
   <!-- 评论项：循环渲染所有评论 -->
  <div class="comment-item" v-for="(comment, index) in comments" :key="index">
 <div class="comment-header">
<!-- 评论用户名称 -->
 <span class="comment-name">{{ comment.username }}</span>
  <!-- 评论日期 -->
   <span class="comment-date">{{ comment.date }}</span>
    </div>
     <!-- 评论内容 -->
      <div class="comment-content">{{ comment.content }}</div>
       </div>
        </div>
         </div>
          </template>

<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, inject, defineEmits, defineProps } from 'vue';

// 定义组件属性：接收文章ID
const props = defineProps({ articleId: String });
// 状态变量：用户登录状态
const isLoggedIn = ref(false);
// 状态变量：新评论内容
const newComment = ref({ content: '' });
// 状态变量：评论列表
const comments = ref([]);
// 注入全局状态：是否为夜间模式
const isNight = inject('isNight');

// 生命周期钩子：组件挂载时执行
onMounted(() => {
  // 从本地存储加载评论（实际应用中应从后端获取）
  const savedComments = localStorage.getItem(`article_comments_${props.articleId}`);
  if (savedComments) {
    comments.value = JSON.parse(savedComments);
  }

  // 检查用户登录状态
  const userInfo = localStorage.getItem('user_info');
  isLoggedIn.value = !!userInfo;
});

// 方法：添加新评论
const addComment = () => {
  // 验证评论内容是否为空
  if (!newComment.value.content.trim()) {
    alert('请输入评论内容');
    return;
  }

  // 获取用户信息（从本地存储）
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{"username":"匿名用户"}');

  // 创建新评论对象
  const comment = {
    id: Date.now(), // 使用时间戳作为唯一ID
    username: userInfo.username, // 评论用户名称
    content: newComment.value.content, // 评论内容
    date: new Date().toLocaleString(), // 评论日期
    articleId: props.articleId // 关联的文章ID
  };

  // 将新评论添加到评论列表开头
  comments.value.unshift(comment);

  // 保存评论到本地存储
  localStorage.setItem(`article_comments_${props.articleId}`, JSON.stringify(comments.value));

  // 清空评论输入框
  newComment.value.content = '';
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
  padding: 30px 0;
  background: rgba(255, 255, 255, 0.05); /* 半透明白色背景 */
  border-radius: 10px;
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
  padding: 10px 20px;
  background: rgba(65, 90, 119, 0.7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button:hover {
  background: rgba(65, 90, 119, 0.9);
  transform: translateY(-2px); /* 悬停时上移效果 */
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
  background: rgba(151, 179, 229, 0.548); /* 半透明蓝紫色背景 */
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 15px;
  backdrop-filter: blur(8px); /* 磨砂玻璃效果 */
  border: 1px solid rgba(255, 255, 255, 0.1);
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
</style>
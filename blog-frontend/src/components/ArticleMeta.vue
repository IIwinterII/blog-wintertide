<template>
 <!-- 文章元信息容器 -->
  <div class="article-meta">
   <!-- 文章日期 -->
    <span><i class="far fa-calendar"></i> {{ article.date }}</span>
   <!-- 文章作者 -->
  <span><i class="far fa-user"></i> {{ article.author }}</span>
 </div>
</template>

<script setup>
// 导入Vue定义属性的函数
import { defineProps } from 'vue'

// 组件定义
export default {
  name: 'ArticleMeta' // 组件名称
}

// 定义组件属性
const props = defineProps({
  article: {
    type: Object, // 类型为对象
    required: true // 必须传入
  }
})
</script>

<style scoped>
/* 文章元信息样式// 使用flex布局// 两端对齐  // 字体大小// 字体颜色// 间距*/
.article-meta {
  display: flex; 
  justify-content: space-between; 
  font-size: 0.9rem;
  color: #a3b1c6; 
  gap: 20px; 
}
</style>
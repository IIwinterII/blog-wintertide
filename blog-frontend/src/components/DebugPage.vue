<template>
  <div class="debug-page">
    <h1>调试页面</h1>
    <div class="debug-actions">
      <button class="wt-chip" @click="testArticleSave">测试文章保存</button>
      <button class="wt-chip" @click="testImageUpload">测试图片上传</button>
    </div>
    
    <div v-if="result" class="debug-result">
      <h2>测试结果</h2>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="debug-error">
      <h2>错误信息</h2>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { testSaveArticle } from '../debug-article';
import { uploadImage } from '../utils/imageUpload';

const result = ref(null);
const error = ref(null);

// 测试文章保存
async function testArticleSave() {
  try {
    result.value = null;
    error.value = null;
    result.value = await testSaveArticle();
  } catch (err) {
    error.value = err.message || '未知错误';
  }
}

// 测试图片上传
async function testImageUpload() {
  try {
    result.value = null;
    error.value = null;
    
    // 创建一个简单的 Canvas 作为测试图片
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('测试图片', 50, 100);
    
    // 将 Canvas 转换为 Blob
    canvas.toBlob(async (blob) => {
      try {
        const imageUrl = await uploadImage(blob);
        result.value = { success: true, imageUrl };
      } catch (err) {
        error.value = err.message || '图片上传失败';
      }
    }, 'image/png');
  } catch (err) {
    error.value = err.message || '未知错误';
  }
}
</script>

<style scoped>
.debug-page {
  max-width: 800px;
  margin: 120px auto 40px;
  padding: 20px;
  color: var(--wt-fg);
}

.debug-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.debug-result, .debug-error {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  overflow: auto;
}

.debug-error {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
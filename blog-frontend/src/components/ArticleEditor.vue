<template>
  <div class="article-editor-container">
    <h1>{{ isEditing ? '编辑文章' : '添加新文章' }}</h1>
    <div v-if="loading" class="loading-indicator">加载中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div class="editor-form">
      <!-- 标题输入 -->
      <div class="form-group">
        <label for="title">文章标题</label>
        <input type="text" id="title" v-model="article.title" placeholder="输入文章标题" required>
      </div>
      
      <!-- 描述输入 -->
      <div class="form-group">
        <label for="description">文章描述</label>
        <textarea id="description" v-model="article.description" placeholder="输入文章描述" rows="3"></textarea>
      </div>
      
      <!-- 内容编辑器 -->
      <div class="form-group">
        <label for="content">文章内容</label>
        <div class="editor-toolbar">
          <button @click="formatText('bold')"><i class="fas fa-bold"></i></button>
          <button @click="formatText('italic')"><i class="fas fa-italic"></i></button>
          <button @click="formatText('underline')"><i class="fas fa-underline"></i></button>
          <button @click="formatText('header')"><i class="fas fa-heading"></i></button>
          <button @click="insertImage()"><i class="fas fa-image"></i></button>
          <button @click="formatText('link')"><i class="fas fa-link"></i></button>
          <button @click="formatText('list')"><i class="fas fa-list-ul"></i></button>
        </div>
        <textarea id="content" v-model="article.content" placeholder="输入文章内容" rows="15"></textarea>
        <p class="editor-hint">提示: 可以使用工具栏进行格式化，或直接输入HTML标签</p>
      </div>
      
      <!-- 图片上传 -->
      <div class="form-group">
        <label for="image-upload">上传图片</label>
        <input type="file" id="image-upload" accept="image/*" @change="handleImageUpload">
        <div class="uploaded-images" v-if="uploadedImages.length > 0">
          <h4>已上传图片:</h4>
          <div v-for="(image, index) in uploadedImages" :key="index" class="uploaded-image">
            <img :src="image.url" alt="上传的图片" :title="image.name">
            <button @click="removeImage(index)"><i class="fas fa-times"></i></button>
          </div>
        </div>
      </div>

      <!-- 标签选择 -->
      <div class="form-group">
        <label>文章标签</label>
        <div class="tags-container">
          <div v-for="tag in allTags" :key="tag" class="tag-option" @click="selectTag(tag)">
            {{ tag }}
          </div>
        </div>
        <div v-if="selectedTag" class="selected-tag">
          {{ selectedTag }}
          <button @click="clearSelectedTag()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-tag-input" v-if="!selectedTag">
          <input type="text" placeholder="输入自定义标签，按Enter确认" @keydown="handleCustomTagInput">
          <p class="tag-hint">提示: 未添加标签的文章将被视为"未分类"</p>
        </div>
      </div>

      <!-- 字数统计 -->
      <div class="form-group word-count">
        <label>文章字数</label>
        <p>{{ article.wordCount }} 字</p>
        <p class="word-count-hint">提示: 字数统计包含标题和内容，不可手动修改</p>
      </div>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <button class="save-button" @click="saveArticle">保存文章</button>
        <button class="cancel-button" @click="cancelEdit">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue组合式API相关函数
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// 导入配置好的API客户端
import apiClient from '../utils/api.js';

// 状态变量定义
const router = useRouter();
const route = useRoute();
const article = ref({});
const isEditing = ref(false);
const articleId = ref(null);
const uploadedImages = ref([]);
const allTags = ref([]);
const selectedTag = ref(''); // 单标签
const loading = ref(false);
const error = ref('');


// 修改 fetchAllTags 方法
const fetchAllTags = async () => {
  try {
    const response = await apiClient.get('/tags'); // 修改为相对路径
    allTags.value = response.data;
  } catch (err) {
    console.error('获取标签失败:', err);
    error.value = '获取标签失败';
  }
}


// 初始化文章数据
const initArticleData = () => {
  const data = {
    title: '',
    description: '',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
    author: 'admin',
    tags: [], // 多标签数组
    wordCount: 0
  };
  article.value = data;
  selectedTag.value = ''; // 清空选中标签
  updateWordCount(); // 确保字数统计初始化
};

onMounted(async () => {
  // 获取所有标签
  await fetchAllTags();

  // 确保获取到的是有效的文章ID
  let id = route.params.id;
  // 如果ID是对象，尝试获取其值
  if (typeof id === 'object' && id !== null) {
    // 尝试从对象中获取有效的ID值
    id = id.id || id.toString() || null;
  }
  // 确保ID是数字或可以转换为数字的字符串
  id = id ? parseInt(id, 10) : null;

  if (id) {
    isEditing.value = true;
    articleId.value = id;
    loading.value = true;
    try {
      // 从后端获取要编辑的文章
      const response = await apiClient.get(`/articles/${id}`);
      article.value = response.data;
      // 设置选中的标签
      selectedTag.value = Array.isArray(article.value.tags) ? article.value.tags[0] || '' : article.value.tags || '';
      // 初始化字数统计
      updateWordCount();
    } catch (err) {
      console.error('获取文章失败:', err);
      error.value = '获取文章失败';
    } finally {
      loading.value = false;
    }
  } else {
    // 新建文章，初始化数据
    initArticleData();
  }
});

// 保存文章时确保使用正确的ID
const saveArticle = async () => {
  if (!article.value.title || !article.value.content) {
    alert('请填写文章标题和内容');
    return;
  }

  // 标签处理：使用选中的标签
  article.value.tags = selectedTag.value || '未分类';

  loading.value = true;
  try {
    if (isEditing.value && articleId.value) {
      // 确保ID是数字
      const numericId = parseInt(articleId.value, 10);
      if (isNaN(numericId)) {
        throw new Error('无效的文章ID');
      }
      await apiClient.put(`/articles/${numericId}`, article.value);
    } else {
      await apiClient.post('/articles', article.value);
    }
    alert('文章保存成功');
    router.push({ name: 'PersonalHome' });
  } catch (err) {
    console.error('保存文章失败:', err);
    error.value = '保存文章失败: ' + (err.message || '请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 监听内容变化，更新字数统计
article.value.content && article.value.content.length > 0 && updateWordCount();

// 更新字数统计
function updateWordCount() {
  // 计算标题和内容的总字数
  const titleCount = article.value.title ? article.value.title.length : 0;
  const contentCount = article.value.content ? article.value.content.length : 0;
  article.value.wordCount = titleCount + contentCount;
}

// 监听标题和内容变化
watch(() => [article.value.title, article.value.content], () => {
  updateWordCount();
});

// 选择标签
function selectTag(tag) {
  selectedTag.value = tag;
}

// 清除选中的标签
function clearSelectedTag() {
  selectedTag.value = '';
}

// 自定义标签输入处理
function handleCustomTagInput(event) {
  if (event.key === 'Enter' && event.target.value.trim()) {
    selectedTag.value = event.target.value.trim();
    event.target.value = '';
  }
}

// 格式化文本
const formatText = (type) => {
  const textarea = document.getElementById('content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  if (!selectedText) {
    // 没有选中文本，插入示例文本
    let exampleText = '';
    switch(type) {
      case 'bold': exampleText = '**加粗文本**'; break;
      case 'italic': exampleText = '*斜体文本*'; break;
      case 'underline': exampleText = '<u>下划线文本</u>'; break;
      case 'header': exampleText = '### 标题'; break;
      case 'link': exampleText = '[链接文本](url)'; break;
      case 'list': exampleText = '- 列表项1\n- 列表项2'; break;
      default: exampleText = '';
    }
    insertText(textarea, exampleText);
  } else {
    // 有选中文本，格式化选中文本
    let formattedText = '';
    switch(type) {
      case 'bold': formattedText = `**${selectedText}**`; break;
      case 'italic': formattedText = `*${selectedText}*`; break;
      case 'underline': formattedText = `<u>${selectedText}</u>`; break;
      case 'header': formattedText = `### ${selectedText}`; break;
      case 'link': formattedText = `[${selectedText}](url)`; break;
      case 'list': 
        const items = selectedText.split('\n');
        formattedText = items.map(item => `- ${item.trim()}`).join('\n');
        break;
      default: formattedText = selectedText;
    }
    replaceSelectedText(textarea, formattedText);
  }
  // 更新Vue绑定的值
  article.value.content = textarea.value;
};

// 插入图片
const insertImage = () => {
  if (uploadedImages.value.length > 0) {
    const lastImage = uploadedImages.value[uploadedImages.value.length - 1];
    const imgTag = `<img src='${lastImage.url}' alt='${lastImage.name}'>`;
    const textarea = document.getElementById('content');
    insertText(textarea, imgTag);
    article.value.content = textarea.value;
  } else {
    alert('请先上传图片');
  }
};

// 处理图片上传
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 上传图片到服务器
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 将服务器返回的图片URL添加到已上传图片列表
      uploadedImages.value.push({
        name: file.name,
        url: response.data.url
      });

      alert('图片上传成功！');
    } catch (err) {
      console.error('图片上传失败:', err);
      alert('图片上传失败: ' + (err.response?.data?.message || '请检查网络或后端服务'));
    }
  }
};

// 移除图片
const removeImage = (index) => {
  uploadedImages.value.splice(index, 1);
};



// 取消编辑
const cancelEdit = () => {
  router.push({ name: 'PersonalHome' });
};

// 辅助函数：在光标位置插入文本
const insertText = (textarea, text) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
};

// 辅助函数：替换选中文本
const replaceSelectedText = (textarea, text) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
};
</script>

<style scoped>
.article-editor-container {
  max-width: 1000px;
  margin: 50px auto;
  padding: 30px;
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-message {
  text-align: center;
  padding: 20px;
  background-color: rgba(255, 0, 0, 0.2);
  color: #ffdddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 标签样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  max-height: 120px;
  overflow-y: auto;
}

.tag-option {
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-option:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.selected-tag {
  margin-top: 15px;
  padding: 8px 15px;
  background: rgba(106, 133, 231, 0.7);
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.selected-tag button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-tag-input {
  margin-top: 15px;
}

.tag-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

/* 字数统计样式 */
.word-count {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.word-count p {
  margin: 0;
  font-size: 1rem;
}

.word-count-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 夜间模式标签样式 */
.night-mode .tag-option {
  background: rgba(40, 40, 40, 0.7) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
}

.night-mode .tag-option:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}

.night-mode .selected-tag {
  background: rgba(60, 60, 100, 0.7) !important;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  font-weight: bold;
  font-size: 1.1rem;
}

input, textarea {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  resize: vertical;
}

input:focus, textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.editor-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.editor-toolbar button {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.editor-toolbar button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.editor-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 5px;
}

.uploaded-images {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.uploaded-image {
  position: relative;
  width: 150px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.uploaded-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploaded-image button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.save-button, .cancel-button {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-button {
  background: rgba(76, 175, 80, 0.7);
  color: white;
}

.save-button:hover {
  background: rgba(76, 175, 80, 1);
  transform: translateY(-3px);
}

.cancel-button {
  background: rgba(255, 87, 34, 0.7);
  color: white;
}

.cancel-button:hover {
  background: rgba(255, 87, 34, 1);
  transform: translateY(-3px);
}

/* 夜间模式样式 */
.night-mode .article-editor-container {
  background: rgba(86, 87, 88, 0.541) !important;
}

.night-mode input, .night-mode textarea {
  background: rgba(60, 60, 70, 0.3) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
}

.night-mode .editor-toolbar button {
  background: rgba(40, 40, 40, 0.7) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
}

.night-mode .editor-toolbar button:hover {
  background: rgba(60, 60, 60, 0.8) !important;
}
</style>
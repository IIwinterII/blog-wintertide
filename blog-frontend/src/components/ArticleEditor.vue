<template>
  <div class="editor page">
    <!-- 头部 -->
    <section class="head wt-card">
      <h2 class="title">{{ isEdit ? '编辑文章' : '新增文章' }}</h2>
      <p class="sub wt-muted">为 Wintertide 写一篇新故事</p>
    </section>

    <!-- 表单 -->
    <section class="form wt-card">
      <div class="row">
        <label class="lbl">标题</label>
        <input v-model.trim="form.title" class="ipt" type="text" placeholder="输入文章标题" />
      </div>

      <div class="row">
        <label class="lbl">摘要</label>
        <input v-model.trim="form.summary" class="ipt" type="text" placeholder="一句话简介（选填）" />
      </div>

      <div class="row">
        <label class="lbl">封面地址</label>
        <input v-model.trim="form.coverUrl" class="ipt" type="text" placeholder="图片 URL（选填）" />
      </div>

      <div class="row">
        <label class="lbl">标签</label>
        <input v-model.trim="tagsInput" class="ipt" type="text" placeholder="使用空格/逗号分隔，如：随笔 冬天 生活" />
      </div>

      <div class="row">
        <label class="lbl">正文</label>
        <textarea v-model="form.content" class="ipt ipt-area" rows="12" placeholder="在这里书写你的内容…"></textarea>
      </div>

      <div class="ops">
        <button class="wt-chip" :disabled="saving" @click="save">
          <i class="far fa-save"></i> {{ saving ? '保存中…' : '保存' }}
        </button>
        <router-link class="wt-chip wt-chip--sm" :to="{ name: 'Home' }">
          <i class="fas fa-home"></i> 返回首页
        </router-link>
      </div>
    </section>

    <!-- 预览（可选） -->
    <section v-if="form.coverUrl" class="preview wt-card">
      <h3 class="pv-title">封面预览</h3>
      <div class="cover" :style="{ backgroundImage: `url(${form.coverUrl})` }"></div>
    </section>

    <!-- 提示 -->
    <div v-if="toastText" class="toast wt-card" :class="toastType">
      <i v-if="toastType==='ok'" class="fas fa-check-circle"></i>
      <i v-else class="fas fa-exclamation-circle"></i>
      <span>{{ toastText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '../utils/api'

const route = useRoute()
const router = useRouter()
const articleId = computed(() => route.params.id ? String(route.params.id) : null)
const isEdit = computed(() => !!articleId.value)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  coverUrl: '',
  tags: [] // 数组形式提交
})

// 供输入的字符串形式
const tagsInput = ref('')

const saving = ref(false)
const toastText = ref('')
const toastType = ref('ok') // ok / err
let toastTimer = null
const showToast = (text, type = 'ok', ms = 1600) => {
  toastText.value = text
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), ms)
}

// 加载编辑数据
onMounted(async () => {
  if (!isEdit.value) return
  try {
    // 优先尝试 /articles/:id
    const res = await apiClient.get(`/articles/${articleId.value}`)
    const a = res.data || {}
    form.title = a.title || ''
    form.summary = a.description || a.summary || ''
    form.content = a.content || ''
    form.coverUrl = a.coverUrl || ''
    // 统一为数组
    const arr = Array.isArray(a.tags)
      ? a.tags
      : (a.tags ? String(a.tags).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean) : [])
    form.tags = arr
    tagsInput.value = arr.join(' ')
  } catch (e) {
    // 回退：若后端无 /articles/:id，可从 /articles 列表中查
    try {
      const list = await apiClient.get('/articles')
      const target = (list.data || []).find(x => String(x.id) === articleId.value)
      if (target) {
        form.title = target.title || ''
        form.summary = target.description || target.summary || ''
        form.content = target.content || ''
        form.coverUrl = target.coverUrl || ''
        const arr = Array.isArray(target.tags)
          ? target.tags
          : (target.tags ? String(target.tags).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean) : [])
        form.tags = arr
        tagsInput.value = arr.join(' ')
      } else {
        showToast('未找到要编辑的文章', 'err', 2000)
      }
    } catch {
      showToast('加载文章失败', 'err', 2000)
    }
  }
})

// 保存
const save = async () => {
  if (!form.title.trim()) {
    showToast('请填写标题', 'err'); return
  }
  // 解析标签字符串到数组
  form.tags = String(tagsInput.value || '')
    .split(/[\s,，#、/|]+/)
    .map(s => s.trim())
    .filter(Boolean)

  saving.value = true
  try {
    const authorName = JSON.parse(localStorage.getItem('user_info') || '{}')?.username || 'Winter'
    const publishDate = Date.now() // 发送毫秒时间戳，后端 Jackson 可稳定反序列化为 java.util.Date
    const payload = {
      title: form.title,
      content: form.content || '',
      description: form.summary || '',
      publishDate,
      author: authorName,
      tags: (form.tags || []).join(' '),
      wordCount: (form.content || '').replace(/\s+/g, '').length
    }
    if (isEdit.value) {
      await apiClient.put(`/articles/${articleId.value}`, payload)
      showToast('已保存', 'ok')
    } else {
      const r = await apiClient.post('/articles', payload)
      showToast('已创建', 'ok')
      // 若返回了新 id，跳转到文章页
      const newId = r?.data?.id
      if (newId != null) {
        setTimeout(() => router.replace({ name: 'Article', params: { id: newId } }), 700)
      }
    }
  } catch (e) {
    console.error(e)
    showToast('保存失败，请稍后重试', 'err', 2000)
  } finally {
    saving.value = false
  }
}
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.page{
  max-width: 1180px;
  margin: 0 auto;
  padding: 120px 16px 40px;
  color: var(--wt-fg);
}

/* 头部 */
.head{
  padding: 14px;
  margin-bottom: 12px;
}
.title{
  margin: 0 0 4px;
  font-size: clamp(20px, 3.8vw, 28px);
  font-weight: 700;
}
.sub{ margin: 0 }

/* 表单 */
.form{ padding: 14px; }
.row{ margin: 10px 0; }
.lbl{ display:block; margin-bottom: 6px; }
.ipt{
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--wt-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  color: var(--wt-fg);
  outline: none;
}
.ipt-area{ min-height: 260px; resize: vertical; }

.ops{
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-top: 10px;
}

/* 预览 */
.preview{ padding: 12px; margin-top: 12px; }
.pv-title{ margin: 0 0 8px; font-size: 1.1rem; }
.cover{
  width: 100%; aspect-ratio: 16 / 9;
  border-radius: 14px;
  background-size: cover; background-position: center;
  border: 1px solid rgba(207,232,255,0.28);
}

/* 提示 */
.toast{
  position: fixed;
  top: 18px; left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  display: inline-flex; align-items: center; gap: 8px;
  z-index: 3000;
}
.toast.ok{ color: #0d1b2a }
.toast.err{ color: #fff; background: rgba(231,76,60,.92) }

@media (max-width: 720px){
  .ipt-area{ min-height: 200px; }
}
</style>
<template>
  <div class="article-comments">
    <h3 class="comments-title">评论区</h3>

    <!-- 未登录提示 -->
    <div v-if="!isLoggedIn" class="login-prompt wt-card wt-card--icecut">
      <p>请先登录后再发表评论</p>
    </div>

    <!-- 昵称设置（已登录） -->
    <div v-else class="nick-set wt-card wt-card--icecut">
      <div class="row">
        <label>我的昵称</label>
        <div class="nick-inline">
          <input class="form-control" v-model.trim="nicknameInput" placeholder="设置你的显示昵称（选填）" />
          <button class="wt-chip wt-chip--sm" @click="saveNickname" :disabled="savingNick">
            <i class="far fa-save"></i> {{ savingNick ? '保存中…' : '保存昵称' }}
          </button>
        </div>
      </div>
      <p class="hint">你将以 “{{ displaySelfName }}” 的身份发表评论</p>
    </div>

    <!-- 评论表单（已登录） -->
    <div v-if="isLoggedIn" class="comment-form wt-card wt-card--icecut">
      <div class="form-group">
        <label for="comment-content">发表评论</label>
        <textarea
          id="comment-content"
          class="form-control"
          v-model="newComment.content"
          placeholder="请输入您的评论"
          rows="3"
          required
        ></textarea>
      </div>

      <!-- 验证码 -->
      <div class="captcha-row">
        <span class="q">{{ captcha.question }}</span>
        <input class="form-control small" v-model.trim="captchaInput" placeholder="结果" @keyup.enter="addComment" />
        <button class="wt-chip wt-chip--sm" @click="regenCaptcha"><i class="fas fa-sync"></i></button>
      </div>

      <button class="submit-button wt-chip" @click="addComment" :disabled="isLoading">
        <span v-if="isLoading">提交中...</span>
        <span v-else>提交评论</span>
      </button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <div v-if="loadingList" class="loading-comments"><p>加载中...</p></div>
      <div v-else-if="comments.length === 0" class="no-comments"><p>暂无评论，快来发表第一条评论吧！</p></div>
      <div
        v-else
        class="comment-item wt-card wt-card--icecut wt-sheen"
        v-for="(comment, index) in comments"
        :key="index"
      >
        <div class="comment-header">
          <span class="comment-name">{{ nameOf(comment) }}</span>
          <span class="comment-date">
            {{ formatDate(comment.createTime) }}
            <button
              v-if="canDelete(comment)"
              class="del-btn"
              title="删除"
              @click="openConfirm(comment)"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
      </div>
    </div>
    <!-- 二次确认弹窗（与文章删除一致风格） -->
    <div v-if="confirmState.visible" class="confirm-mask" @click.self="closeConfirm">
      <div class="confirm-dialog wt-card">
        <h3 class="c-title">
          <i class="fas fa-exclamation-triangle"></i>
          {{ confirmState.step === 1 ? '确定要删除该评论吗？' : '请再次确认删除操作' }}
        </h3>
        <p class="c-desc wt-muted" v-if="confirmState.step === 1">
          此操作将永久删除该评论，且不可恢复。
        </p>
        <p class="c-desc wt-muted" v-else>
          删除后不可恢复，是否继续？
        </p>
        <div class="c-actions">
          <button class="wt-chip wt-chip--sm" @click="closeConfirm">取消</button>
          <button
            v-if="confirmState.step === 1"
            class="wt-chip wt-chip--sm"
            @click="nextConfirmStep"
          >继续</button>
          <button
            v-else
            class="wt-chip wt-chip--sm danger"
            @click="deleteComment(confirmState.target)"
          >继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, computed } from 'vue'
import apiClient, { getCommentsByArticleId, addComment as apiAddComment } from '../utils/api'
import { sanitizeHtml, throttleSubmit, makeCaptcha, verifyCaptcha, getNickname, setNickname } from '../utils/security'

const props = defineProps({ articleId: [String, Number] })
const emit = defineEmits(['posted', 'loaded'])

const isLoggedIn = ref(false)
const newComment = ref({ content: '' })
const comments = ref([])
const isLoading = ref(false)
const loadingList = ref(false)
const error = ref('')

// 当前登录用户
const currentUser = ref(null)

// 昵称
const nicknameInput = ref('')
const savingNick = ref(false)
const displaySelfName = computed(() => nicknameInput.value || currentUser.value?.username || '游客')

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateString
  }
}

// 验证码
const captcha = ref(makeCaptcha())
const captchaInput = ref('')
const regenCaptcha = () => {
  captcha.value = makeCaptcha()
  captchaInput.value = ''
}

// 名称显示：优先 nickname，然后 username；若为当前用户且本地昵称已设置，使用本地昵称
const nameOf = (c) => {
  const uid = Number(currentUser.value?.id ?? currentUser.value?.userId)
  const cid = Number(c?.userId ?? c?.uid)
  if (uid && cid && uid === cid) {
    return (nicknameInput.value || c.nickname || c.username || '匿名')
  }
  return c.nickname || c.username || '匿名'
}

// 删除权限与操作
const isAdmin = computed(() => {
  const uname = String(currentUser.value?.username || '').trim().toLowerCase()
  return uname === 'admin' || uname === 'winter' || uname === 'wintertide'
})
const canDelete = (c) => {
  const uid = Number(currentUser.value?.id ?? currentUser.value?.userId)
  const cid = Number(c?.userId ?? c?.uid)
  return isAdmin.value || (uid && cid && uid === cid)
}

// 二次确认弹窗状态与操作
const confirmState = ref({ visible: false, step: 1, target: null })
const openConfirm = (c) => {
  if (!canDelete(c)) return
  confirmState.value.visible = true
  confirmState.value.step = 1
  confirmState.value.target = c
}
const nextConfirmStep = () => { if (confirmState.value.step === 1) confirmState.value.step = 2 }
const closeConfirm = () => {
  confirmState.value.visible = false
  confirmState.value.step = 1
  confirmState.value.target = null
}

// 实际删除
const deleteComment = async (c) => {
  if (!canDelete(c)) return
  try {
    const id = c?.id ?? c?.commentId
    if (!id) { alert('缺少评论ID，无法删除'); return }
    const res = await apiClient.delete(`/comments/${id}`)
    if (res.status === 200 || res.status === 204) {
      comments.value = comments.value.filter(x => (x.id ?? x.commentId) !== id)
      emit('loaded', comments.value.length)
      closeConfirm()
    } else {
      alert('删除失败')
    }
  } catch (e) {
    console.error('删除失败', e)
    alert('删除失败，请稍后重试')
  }
}

const fetchComments = async () => {
  loadingList.value = true
  error.value = ''
  try {
    const idNum = Number(props.articleId)
    const res = await getCommentsByArticleId(Number.isFinite(idNum) ? idNum : props.articleId)
    comments.value = Array.isArray(res.data) ? res.data : []
    emit('loaded', comments.value.length)
  } catch (err) {
    error.value = err?.response?.status === 403 ? '后端服务正在启动中，请稍后重试' : '获取评论失败，请重试'
    console.error('Failed to fetch comments:', err)
  } finally {
    loadingList.value = false
  }
}

const addComment = async () => {
  const raw = String(newComment.value.content || '')
  if (!raw.trim()) { alert('请输入评论内容'); return }

  // 简易验证码校验
  if (!verifyCaptcha(captcha.value, captchaInput.value)) {
    error.value = '验证码错误，请重试'
    regenCaptcha()
    return
  }

  // 限流：同一用户同一文章 5s 内只允许一次提交
  const uname = currentUser.value?.username || 'guest'
  const key = `comment:${props.articleId}:${uname}`
  const tl = throttleSubmit(key, 5000)
  if (!tl.ok) {
    error.value = `操作太频繁，请 ${Math.ceil(tl.wait / 1000)} 秒后再试`
    return
  }

  // 清洗输入（去除潜在危险标签），再去掉所有标签留纯文本
  const cleaned = sanitizeHtml(raw).replace(/<[^>]+>/g, '').trim()
  if (!cleaned) { alert('评论内容无效'); return }

  isLoading.value = true
  error.value = ''
  try {
    const payload = {
      articleId: Number(props.articleId),
      content: cleaned,
      username: currentUser.value?.username,
      userId: Number(currentUser.value?.id ?? currentUser.value?.userId),
      nickname: nicknameInput.value || undefined
    }
    const response = await apiAddComment(payload)
    if (response && (response.status === 200 || response.status === 201)) {
      await fetchComments()
      newComment.value.content = ''
      emit('posted', comments.value.length)
      regenCaptcha()
    } else {
      error.value = (response?.data?.message) || '添加评论失败'
    }
  } catch (err) {
    error.value = '添加评论失败，请重试'
    console.error('Failed to add comment:', err)
  } finally {
    isLoading.value = false
  }
}

const saveNickname = async () => {
  savingNick.value = true
  try {
    const v = setNickname(nicknameInput.value)
    // 可选：尝试同步到后端（若有接口）
    try {
      await fetch('/api/profile/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: v })
      }).catch(() => {})
    } catch {}
  } finally {
    savingNick.value = false
  }
}

const onNickUpdated = (e) => {
  nicknameInput.value = String(e.detail || '').trim()
}

onMounted(() => {
  try {
    const u = JSON.parse(localStorage.getItem('user_info') || 'null')
    isLoggedIn.value = !!u
    currentUser.value = u
  } catch {
    isLoggedIn.value = false
  }
  nicknameInput.value = getNickname()
  fetchComments()
  window.addEventListener('wt-nickname-updated', onNickUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('wt-nickname-updated', onNickUpdated)
})
</script>

<style scoped>
.article-comments {
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.comments-title { font-size: 1.5rem; margin-bottom: 16px; color: #fff; }

/* 昵称设置 */
.nick-set { margin-bottom: 14px; padding: 12px; }
.nick-set .row{ margin-bottom: 8px; }
.nick-inline{ display: flex; gap: 10px; align-items: center; }
.nick-set .hint{ margin: 0; color: rgba(255,255,255,.7); font-size: .92rem; }

/* 表单 */
.comment-form { margin-bottom: 14px; padding-bottom: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display:block; margin-bottom: 8px; color: #fff; }
.form-control {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  transition: all .2s ease;
}
.form-control.small { max-width: 120px; }

/* 验证码 */
.captcha-row{
  display: flex; align-items: center; gap: 10px;
  margin: 8px 0 12px;
}
.captcha-row .q{ color: #e6f0ff; font-weight: 600; }

.submit-button { background: transparent; border: none; padding: 0; }
.submit-button:hover { transform: translateY(-2px); }
.submit-button:disabled { opacity: .6; cursor: not-allowed; transform: none; }

.error-message {
  padding: 10px 12px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 10px;
  color: #dc3545;
  margin-top: 10px;
}

/* 列表 */
.comments-list { margin-top: 12px; }
.loading-comments { text-align: center; padding: 12px 0; color: rgba(255,255,255,0.7); }
.no-comments { text-align: center; padding: 18px 0; color: rgba(255,255,255,0.7); }

.comment-item { padding: 16px; border-radius: 14px; margin-bottom: 12px; position: relative; }
.comment-header {
  display: flex; justify-content: space-between;
  margin-bottom: 8px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.comment-name { font-weight: 600; color: #fff; }
.comment-date { font-size: .86rem; color: rgba(255,255,255,0.7); display: inline-flex; align-items: center; gap: 6px; }
.del-btn{
  margin-left: 8px;
  width: 28px; height: 28px;
  display: grid; place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(207,232,255,0.28);
  background: transparent;
  color: rgba(230,240,255,0.85);
  cursor: pointer;
  transition: transform .2s ease, background .2s ease, border-color .2s ease;
}
.del-btn:hover{ transform: translateY(-1px); background: rgba(255,255,255,.10); border-color: rgba(142,197,255,.7); }

/* 二次确认弹窗样式（与文章删除一致风格） */
.confirm-mask{
  position: fixed; inset: 0; z-index: 20;
  display: grid; place-items: center;
  background: rgba(6,12,20,.45);
  backdrop-filter: blur(4px);
}
.day-mode .confirm-mask{ background: rgba(20,30,45,.28) }
.confirm-dialog{ width: min(560px, 92%); padding: 16px; }
.c-title{ display: flex; align-items: center; gap: 10px; margin: 0 0 8px 0; }
.c-title i{ color: #ffd166; }
.c-desc{ margin: 6px 0 12px; }
.c-actions{ display: flex; gap: 10px; justify-content: flex-end; }
.c-actions .wt-chip.danger{
  background: rgba(220,53,69,0.22);
  border-color: rgba(220,53,69,0.45);
  color: #ffd6da;
}

.comment-content { color: rgba(255,255,255,0.95); line-height: 1.6; }
</style>

<style>
/* 夜间模式适配（若站点使用 night-mode 类切换） */
.night-mode .article-comments .comment-item,
.night-mode .article-comments .login-prompt,
.night-mode .article-comments .nick-set,
.night-mode .article-comments .comment-form {
  background: rgba(60, 60, 70, 0.30) !important;
}
.night-mode .article-comments .form-control {
  background: rgba(60, 60, 70, 0.30) !important;
}
.night-mode .article-comments .error-message {
  background: rgba(220, 53, 69, 0.10) !important;
  border-color: rgba(220, 53, 69, 0.20) !important;
}
</style>
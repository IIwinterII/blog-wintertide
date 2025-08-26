import axios from 'axios'

// 创建 Axios 实例（保留对 /api 的代理）
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// ===== 全局轻量加载指示（自动挂到 body，不被导航遮挡） =====
let activeRequests = 0
let overlayEl = null
let styleEl = null

function ensureOverlay() {
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'wt-global-loading-style'
    styleEl.textContent = `
#wt-global-loading{position:fixed;left:0;right:0;top:86px;display:none;justify-content:center;z-index:2147483645;pointer-events:none}
#wt-global-loading.active{display:flex}
#wt-global-loading .wt-spinner{width:34px;height:34px;border:3px solid rgba(230,240,255,.25);border-top-color:rgba(142,197,255,.95);border-radius:50%;animation:wt-spin .9s linear infinite}
@keyframes wt-spin{to{transform:rotate(360deg)}}
@media (max-width:700px){#wt-global-loading{top:76px}}
@media (max-width:480px){#wt-global-loading{top:68px}}
    `.trim()
    document.head.appendChild(styleEl)
  }
  if (!overlayEl) {
    overlayEl = document.createElement('div')
    overlayEl.id = 'wt-global-loading'
    const spinner = document.createElement('div')
    spinner.className = 'wt-spinner'
    overlayEl.appendChild(spinner)
    document.body.appendChild(overlayEl)
  }
}

function showLoading() {
  ensureOverlay()
  overlayEl.classList.add('active')
}

function hideLoading() {
  if (!overlayEl) return
  if (activeRequests <= 0) {
    overlayEl.classList.remove('active')
  }
}

// 请求拦截：默认显示加载，支持跳过
apiClient.interceptors.request.use(
  (config) => {
    const skip =
      config._skipLoading === true ||
      (config.headers && (config.headers['X-Skip-Loading'] === '1' || config.headers['x-skip-loading'] === '1'))
    if (!skip) {
      activeRequests++
      showLoading()
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：并发计数归零时隐藏加载
const finalize = () => {
  if (activeRequests > 0) activeRequests--
  if (activeRequests === 0) hideLoading()
}

apiClient.interceptors.response.use(
  (response) => {
    finalize()
    return response
  },
  (error) => {
    finalize()
    return Promise.reject(error)
  }
)

// ===== 兼容旧代码的命名导出（恢复 addComment 等） =====

// 文章
export const getArticles = (params) => apiClient.get('/articles', { params })
export const getArticleById = (id) => apiClient.get(`/articles/${id}`)
export const createArticle = (data) => apiClient.post('/articles', data)
export const updateArticle = (id, data) => apiClient.put(`/articles/${id}`, data)
export const deleteArticle = (id) => apiClient.delete(`/articles/${id}`)

// 评论
export const getCommentsByArticleId = (articleId) => apiClient.get(`/comments/article/${articleId}`)
// 兼容 ArticleComments.vue 引用的 addComment(data) 或 addComment(articleId, content, author)
export const addComment = (arg1, arg2, arg3) => {
  // 兼容两种签名：
  // 1) addComment({ articleId, content, username, userId, author? })
  // 2) addComment(articleId, content, username?)
  let payload
  if (typeof arg1 === 'object' && arg1) {
    payload = { articleId: arg1.articleId, content: arg1.content }
    // 首选使用 username/userId
    if (arg1.username) payload.username = arg1.username
    if (arg1.userId != null) payload.userId = arg1.userId
    // 兼容旧字段 author → username
    if (!payload.username && arg1.author) payload.username = arg1.author
  } else {
    payload = { articleId: arg1, content: arg2 }
    if (arg3) payload.username = arg3
  }
  // 若缺少登录信息，尝试从本地存储补齐
  if (!payload.username || payload.userId == null) {
    try {
      const user = JSON.parse(localStorage.getItem('user_info') || '{}')
      if (!payload.username && user && user.username) payload.username = user.username
      if (payload.userId == null && user && (user.id != null)) payload.userId = user.id
    } catch {}
  }
  return apiClient.post('/comments', payload)
}

// 标签（若有）
export const getTags = () => apiClient.get('/tags')

// 认证（若有登录注册接口）
export const login = (data) => apiClient.post('/auth/login', data)
export const register = (data) => apiClient.post('/auth/register', data)

// 默认导出 axios 实例，供需要自定义请求的地方使用
export default apiClient
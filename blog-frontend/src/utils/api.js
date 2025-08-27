import axios from 'axios'

// ========= 基础配置 =========
const BASE_URL = import.meta?.env?.VITE_API_BASE || '/api'
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
})

// ========= 全局轻量加载指示（自动挂到 body，不被导航遮挡） =========
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
function showLoading() { ensureOverlay(); overlayEl.classList.add('active') }
function hideLoading() { if (!overlayEl) return; if (activeRequests <= 0) overlayEl.classList.remove('active') }

// ========= ETag/Last-Modified 简易缓存 =========
const CACHE_PREFIX = 'wt_api_cache:'
function serializeParams(params) {
  if (!params) return ''
  try { return JSON.stringify(params) } catch { return String(params) }
}
function makeCacheKey(config) {
  const url = (config.baseURL || '') + (config.url || '')
  const qs = serializeParams(config.params)
  return `${config.method || 'get'} ${url} ${qs}`
}
function getCache(k) {
  try {
    const body = localStorage.getItem(CACHE_PREFIX + 'body:' + k)
    const meta = JSON.parse(localStorage.getItem(CACHE_PREFIX + 'meta:' + k) || 'null')
    return { body: body ? JSON.parse(body) : null, meta }
  } catch { return { body: null, meta: null } }
}
function setCache(k, data, etag, lastMod) {
  try {
    localStorage.setItem(CACHE_PREFIX + 'body:' + k, JSON.stringify(data))
    localStorage.setItem(CACHE_PREFIX + 'meta:' + k, JSON.stringify({ etag, lastMod, t: Date.now() }))
  } catch {}
}

// ========= 请求拦截 =========
apiClient.interceptors.request.use(
  (config) => {
    // Loading
    const skip = config._skipLoading === true ||
      (config.headers && (config.headers['X-Skip-Loading'] === '1' || config.headers['x-skip-loading'] === '1'))
    if (!skip) { activeRequests++; showLoading() }

    // Authorization
    try {
      const u = JSON.parse(localStorage.getItem('user_info') || '{}')
      if (u?.token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${u.token}`
      }
    } catch {}

    // 条件请求（GET）
    if ((config.method || 'get').toLowerCase() === 'get') {
      const key = makeCacheKey(config)
      const { meta } = getCache(key)
      config.headers = config.headers || {}
      if (meta?.etag) config.headers['If-None-Match'] = meta.etag
      if (meta?.lastMod) config.headers['If-Modified-Since'] = meta.lastMod
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ========= 响应拦截 =========
const finalize = () => {
  if (activeRequests > 0) activeRequests--
  if (activeRequests === 0) hideLoading()
}

apiClient.interceptors.response.use(
  (response) => {
    try {
      // ETag/Last-Modified 缓存写入与 304 回退
      const method = (response.config?.method || 'get').toLowerCase()
      const key = makeCacheKey(response.config || {})
      if (method === 'get') {
        if (response.status === 200) {
          const etag = response.headers?.etag
          const lastMod = response.headers?.['last-modified']
          setCache(key, response.data, etag, lastMod)
        } else if (response.status === 304) {
          const { body } = getCache(key)
          if (body != null) {
            // 用缓存数据回退为 200
            response = { ...response, status: 200, data: body }
          }
        }
      }
    } catch {}
    finalize()
    return response
  },
  (error) => {
    finalize()
    return Promise.reject(error)
  }
)

// ========= 命名导出（兼容旧代码） =========
// 文章
export const getArticles = (params) => apiClient.get('/articles', { params })
export const getArticleById = (id) => apiClient.get(`/articles/${id}`)
export const createArticle = (data) => apiClient.post('/articles', data)
export const updateArticle = (id, data) => apiClient.put(`/articles/${id}`, data)
export const deleteArticle = (id) => apiClient.delete(`/articles/${id}`)

// 评论
export const getCommentsByArticleId = (articleId) => apiClient.get(`/comments/article/${articleId}`)
// 兼容 ArticleComments.vue 引用的 addComment
export const addComment = (arg1, arg2, arg3) => {
  let payload
  if (typeof arg1 === 'object' && arg1) {
    payload = { articleId: arg1.articleId, content: arg1.content }
    if (arg1.username) payload.username = arg1.username
    if (arg1.userId != null) payload.userId = arg1.userId
    if (arg1.nickname) payload.nickname = arg1.nickname
    if (!payload.username && arg1.author) payload.username = arg1.author
  } else {
    payload = { articleId: arg1, content: arg2 }
    if (arg3) payload.username = arg3
  }
  if (!payload.username || payload.userId == null) {
    try {
      const user = JSON.parse(localStorage.getItem('user_info') || '{}')
      if (!payload.username && user?.username) payload.username = user.username
      if (payload.userId == null && (user?.id != null)) payload.userId = user.id
      if (!payload.nickname && user?.nickname) payload.nickname = user.nickname
    } catch {}
  }
  return apiClient.post('/comments', payload)
}

// 标签
export const getTags = () => apiClient.get('/tags')

// 认证（若存在）
export const login = (data) => apiClient.post('/auth/login', data)
export const register = (data) => apiClient.post('/auth/register', data)

// 默认导出 axios 实例
export default apiClient
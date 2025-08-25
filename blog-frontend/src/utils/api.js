// frontend/src/utils/api.js
    import axios from 'axios';
    const apiClient = axios.create({
      baseURL: '/api'
    });
    // 添加请求拦截器（暂时移除JWT认证）
apiClient.interceptors.request.use(config => {
  // 注释掉JWT认证，因为后端没有实现
  /*const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    config.headers['Authorization'] = `Bearer ${user.token}`; // 假设使用JWT认证
  }*/
  return config;
});

export default apiClient;

export const getCommentsByArticleId = (articleId) => {
  return apiClient.get(`/comments/article/${articleId}`);
};

export const addComment = (comment) => {
  return apiClient.post('/comments', comment);
};

export const deleteComment = (id) => {
  return apiClient.delete(`/comments/${id}`);
};
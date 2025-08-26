// 调试文章保存问题
import apiClient from './utils/api';

// 测试保存文章
async function testSaveArticle() {
  try {
    // 使用 Date 对象而不是字符串
    const now = new Date();
    
    // 创建测试文章数据
    const testArticle = {
      title: "测试文章",
      content: "<p>这是一个测试文章</p>",
      description: "测试描述",
      publishDate: now,
      author: "测试作者",
      tags: "测试 标签",
      wordCount: 10,
      coverUrl: ""
    };
    
    console.log('测试保存文章:', testArticle);
    
    // 发送请求
    const response = await apiClient.post('/articles', testArticle);
    console.log('保存成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('保存失败:', error);
    if (error.response) {
      console.error('错误响应:', error.response.data);
      console.error('状态码:', error.response.status);
    }
    throw error;
  }
}

// 导出测试函数
export { testSaveArticle };
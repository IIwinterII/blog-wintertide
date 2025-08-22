// 登录API
const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('登录请求失败:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
};

// 注册API
const register = async (username, password, email) => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('注册请求失败:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
};

// 导出认证函数
export {
  login,
  register
};
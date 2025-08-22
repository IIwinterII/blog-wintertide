<template>
  <!-- 添加登录成功提示 -->
  <div v-if="showLoginSuccess" class="global-login-success-toast">
    <i class="fas fa-check-circle"></i> 登录成功！
  </div>

  <!-- 添加注册成功提示 -->
  <div v-if="showRegisterSuccess" class="global-login-success-toast">
    <i class="fas fa-check-circle"></i> 注册成功！即将跳转到登录页面...
  </div>

  <!-- 添加登录错误提示 -->
  <div v-if="showLoginError" class="global-login-error-toast">
    <i class="fas fa-exclamation-circle"></i> {{ loginErrorMessage }}
  </div>

  <!-- 添加注册错误提示 -->
  <div v-if="showRegisterError" class="global-login-error-toast">
    <i class="fas fa-exclamation-circle"></i> {{ registerErrorMessage }}
  </div>

  <!-- 登录模态框：点击遮罩层外部可关闭 -->
  <div class="modal-backdrop" :class="{ 'active': showLogin }" @click.self="showLogin = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>欢迎回来</h2>
        <p>请登录您的账户</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group horizontal-form">
          <label for="login-email" class="form-label">
            <i class="fas fa-user"></i>
            <span>账号</span>
          </label>
          <input type="text" id="login-email" class="form-control" placeholder="请输入账号" v-model="loginForm.username" required>
        </div>
        <div class="form-group horizontal-form">
          <label for="login-password" class="form-label">
            <i class="fas fa-lock"></i>
            <span>密码</span>
          </label>
          <div class="password-input-container">
            <input :type="showLoginPassword ? 'text' : 'password'" id="login-password" class="form-control" placeholder="请输入密码" v-model="loginForm.password" required>
            <button type="button" class="toggle-password" @click="showLoginPassword = !showLoginPassword">
              <i class="fas" :class="showLoginPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="submit-button">登录</button>
        <div class="form-footer">还没有账户?
          <span class="toggle-form" @click="showRegister = true; showLogin = false">立即注册</span>
        </div>
      </form>
    </div>
  </div>

  <!-- 注册模态框：结构与登录模态框类似 -->
  <div class="modal-backdrop" :class="{ 'active': showRegister }" @click.self="showRegister = false">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>加入Wintertide</h2>
        <p>创建您的账户</p>
      </div>
      <form @submit.prevent="handleRegister">
        <div class="form-group horizontal-form">
          <label for="register-name" class="form-label">
            <i class="fas fa-user-plus"></i>
            <span>用户名</span>
          </label>
          <input type="text" id="register-name" class="form-control" placeholder="设置您的用户名" v-model="registerForm.username" required>
        </div>
        <div class="form-group horizontal-form">
          <label for="register-email" class="form-label">
            <i class="fas fa-envelope"></i>
            <span>邮箱</span>
          </label>
          <input type="email" id="register-email" class="form-control" placeholder="请输入邮箱" v-model="registerForm.email" required>
        </div>
        <div class="form-group horizontal-form">
          <label for="register-password" class="form-label">
            <i class="fas fa-lock"></i>
            <span>密码</span>
          </label>
          <div class="password-input-container">
            <input :type="showRegisterPassword ? 'text' : 'password'" id="register-password" class="form-control" placeholder="请输入密码" v-model="registerForm.password" required>
            <button type="button" class="toggle-password" @click="showRegisterPassword = !showRegisterPassword">
              <i class="fas" :class="showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>
        <div class="form-group horizontal-form">
          <label for="register-confirm" class="form-label">
            <i class="fas fa-lock"></i>
            <span>确认密码</span>
          </label>
          <div class="password-input-container">
            <input :type="showRegisterConfirmPassword ? 'text' : 'password'" id="register-confirm" class="form-control" placeholder="请确认密码" v-model="registerForm.confirmPassword" required>
            <button type="button" class="toggle-password" @click="showRegisterConfirmPassword = !showRegisterConfirmPassword">
              <i class="fas" :class="showRegisterConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>
        <button type="submit" class="submit-button">注册</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
// 导入认证函数
import { login, register } from '../data/auth.js';

// 定义props
const props = defineProps({
  isNight: Boolean
});

// 定义emits
const emit = defineEmits(['loginSuccess']);

// 状态变量定义
const showLogin = ref(false);  // 登录模态框是否显示
const showRegister = ref(false);  // 注册模态框是否显示
const isLoggedIn = ref(false);  // 用户登录状态
const loginForm = ref({ username: '', password: '' }); // 登录表单数据
const registerForm = ref({ username: '', password: '', email: '', confirmPassword: '' }); // 注册表单数据
// 密码可见性控制
const showLoginPassword = ref(false);  // 控制登录密码可见性
const showRegisterPassword = ref(false);  // 控制注册密码可见性
const showRegisterConfirmPassword = ref(false);  // 控制确认密码可见性
const showLoginSuccess = ref(false);  // 登录成功提示状态
const showRegisterSuccess = ref(false);  // 注册成功提示状态
const showLoginError = ref(false);  // 登录错误提示状态
const showRegisterError = ref(false);  // 注册错误提示状态
const loginErrorMessage = ref('');  // 登录错误提示消息
const registerErrorMessage = ref('');  // 注册错误提示消息
const isLoggingIn = ref(false); // 登录中状态
const isRegistering = ref(false); // 注册中状态

// 显示登录模态框
const showLoginModal = () => {
  showLogin.value = true;
};

// 关闭登录模态框
const closeLoginModal = () => {
  showLogin.value = false;
};

// 登录处理函数
const handleLogin = async () => {
  // 获取表单输入的账号和密码
  const { username, password } = loginForm.value;
  
  // 验证输入
  if (!username || !password) {
    showLoginError.value = true;
    loginErrorMessage.value = '请输入账号和密码';
    setTimeout(() => {
      showLoginError.value = false;
    }, 3000);
    return;
  }
  
  // 设置登录中状态
  isLoggingIn.value = true;
  
  try {
    // 调用登录API
    const result = await login(username, password);

    if (result.success) {
      // 登录成功
      localStorage.setItem('user_info', JSON.stringify(result.user));

      // 触发登录成功事件
      emit('loginSuccess', result.user);
      showLoginSuccess.value = true;
      isLoggedIn.value = true;
      // 3秒后自动隐藏提示
      setTimeout(() => {
        showLoginSuccess.value = false;
      }, 3000);
      // 关闭模态框
      showLogin.value = false;
      // 延迟1秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      // 登录失败 - 使用自定义错误提示
      showLoginError.value = true;
      loginErrorMessage.value = result.message || '登录失败';
      // 3秒后自动隐藏
      setTimeout(() => {
        showLoginError.value = false;
      }, 3000);
    }
  } catch (error) {
    // 网络错误或其他异常
    showLoginError.value = true;
    loginErrorMessage.value = '登录请求失败，请检查网络连接';
    setTimeout(() => {
      showLoginError.value = false;
    }, 3000);
  } finally {
    // 重置登录中状态
    isLoggingIn.value = false;
  }
};

// 注册处理
const handleRegister = async () => {
  // 获取表单输入
  const { username, password, email, confirmPassword } = registerForm.value;
  
  // 验证输入
  if (!username || !password || !email || !confirmPassword) {
    showRegisterError.value = true;
    registerErrorMessage.value = '请填写所有字段';
    setTimeout(() => {
      showRegisterError.value = false;
    }, 3000);
    return;
  }
  
  if (password !== confirmPassword) {
    showRegisterError.value = true;
    registerErrorMessage.value = '密码和确认密码不匹配';
    setTimeout(() => {
      showRegisterError.value = false;
    }, 3000);
    return;
  }
  
  // 设置注册中状态
  isRegistering.value = true;
  
  try {
    // 调用注册API
    const result = await register(username, password, email);

    if (result.success) {
      // 注册成功
      showRegisterSuccess.value = true;
      registerForm.value = { username: '', password: '', email: '', confirmPassword: '' };
      
      // 3秒后自动切换到登录页面
      setTimeout(() => {
        showRegister.value = false;
        showLogin.value = true;
        showRegisterSuccess.value = false;
      }, 3000);
    } else {
      // 注册失败
      showRegisterError.value = true;
      registerErrorMessage.value = result.message || '注册失败';
      setTimeout(() => {
        showRegisterError.value = false;
      }, 3000);
    }
  } catch (error) {
    // 网络错误或其他异常
    showRegisterError.value = true;
    registerErrorMessage.value = '注册请求失败，请检查网络连接';
    setTimeout(() => {
      showRegisterError.value = false;
    }, 3000);
  } finally {
    // 重置注册中状态
    isRegistering.value = false;
  }
};

// 确保正确暴露方法给父组件
defineExpose({
  showLoginModal,
  closeLoginModal
});
</script>

<style scoped>
/* 模态框样式 */
.modal {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 30px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.4s ease, opacity 0.4s ease;
}

/* 模态框头部样式 */
.modal-header {
  margin-bottom: 25px;
  text-align: center;
}

.modal-header h2 {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #fff;
}

.modal-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

/* 模态框遮罩层 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

/* 遮罩层激活状态 */
.modal-backdrop.active {
  opacity: 1;
  pointer-events: all;
}

/* 表单组样式 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-label i {
  margin-right: 8px;
}

/* 表单输入框 */
.form-control {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

/* 水平表单布局 */
.horizontal-form {
  display: flex;
  flex-direction: column;
}

/* 输入框焦点样式 */
.form-control:focus {
  outline: none;
  border-color: rgba(100, 149, 237, 0.8);
  background: rgba(255, 255, 255, 0.38);
  box-shadow: 0 0 0 3px rgba(100, 149, 237, 0.3);
}

/* 密码输入容器 */
.password-input-container {
  position: relative;
}

/* 切换密码可见性按钮 */
.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 1rem;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  padding: 14px;
  background: rgba(65, 90, 119, 0.7);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(0, 0, 0, 0.3);
  background: rgba(65, 90, 119, 0.9);
}

/* 表单底部文字 */
.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
}

/* 切换表单链接 */
.toggle-form {
  color: #778da9;
  cursor: pointer;
  text-decoration: underline;
}

.toggle-form:hover {
  color: #a3b1c6;
}

/* 全局登录成功提示样式 - 顶部显示 */
.global-login-success-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(46, 204, 113, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: globalFadeInOut 3s ease forwards;
}

/* 全局登录错误提示样式 - 顶部显示 */
.global-login-error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 4000;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: globalFadeInOut 3s ease forwards;
}

/* 全局提示框动画 */
@keyframes globalFadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

/* 注册成功提示样式 */
.register-success-message {
  margin: 15px 0;
  padding: 10px;
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 5px;
  color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-success-message i {
  margin-right: 8px;
}
/* 已移除未使用的动画定义，改为使用App.vue中的全局动画 */
/* 夜间模式样式调整 */
.night-mode .modal {
  background: rgba(40, 40, 40, 0.7) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
}

.night-mode .modal-header h2,
.night-mode .modal-header p,
.night-mode .form-label,
.night-mode .form-footer,
.night-mode .toggle-form {
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .form-control {
  background: rgba(60, 60, 60, 0.5) !important;
  border-color: rgba(100, 100, 100, 0.5) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .submit-button {
  background: rgba(80, 80, 80, 0.7) !important;
  color: rgba(220, 220, 220, 0.9) !important;
}

.night-mode .submit-button:hover {
  background: rgba(100, 100, 100, 0.8) !important;
}
</style>
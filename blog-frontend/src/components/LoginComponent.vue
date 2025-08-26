<template>
  <div class="login-page">
    <!-- 成功/错误提示（沿用全局类名，便于主题样式复用） -->
    <div v-if="showLoginSuccess" class="global-login-success-toast">
      <i class="fas fa-check-circle"></i> 登录成功！
    </div>
    <div v-if="showRegisterSuccess" class="global-login-success-toast">
      <i class="fas fa-check-circle"></i> 注册成功！已切换到登录
    </div>
    <div v-if="showLoginError" class="global-login-error-toast">
      <i class="fas fa-exclamation-circle"></i> {{ loginErrorMessage }}
    </div>
    <div v-if="showRegisterError" class="global-login-error-toast">
      <i class="fas fa-exclamation-circle"></i> {{ registerErrorMessage }}
    </div>

    <!-- 居中玻璃卡片 -->
    <section class="login-card wt-card">
      <header class="head">
        <h1 class="title">Wintertide</h1>
        <p class="sub wt-muted">在雪与光之间，写一段暖意的故事</p>
      </header>

      <!-- 标签切换 -->
      <div class="tabs">
        <button
          class="wt-chip tab-chip"
          :class="{ 'is-active': mode === 'login' }"
          @click="switchMode('login')"
        >
          <i class="fas fa-sign-in-alt"></i> 登录
        </button>
        <button
          class="wt-chip tab-chip"
          :class="{ 'is-active': mode === 'register' }"
          @click="switchMode('register')"
        >
          <i class="fas fa-user-plus"></i> 注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="mode === 'login'" class="form" @submit.prevent="handleLogin">
        <div class="row">
          <label class="lbl"><i class="fas fa-user"></i> 账号</label>
          <input
            v-model.trim="loginForm.username"
            class="ipt"
            type="text"
            placeholder="请输入账号"
            autocomplete="username"
          />
        </div>
        <div class="row">
          <label class="lbl"><i class="fas fa-lock"></i> 密码</label>
          <div class="pw">
            <input
              v-model.trim="loginForm.password"
              class="ipt"
              :type="showLoginPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="toggle" @click="showLoginPassword = !showLoginPassword">
              <i class="fas" :class="showLoginPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>

        <button class="wt-chip submit" :disabled="isLoggingIn">
          <i class="far fa-paper-plane"></i> {{ isLoggingIn ? '登录中…' : '登录' }}
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else class="form" @submit.prevent="handleRegister">
        <div class="row">
          <label class="lbl"><i class="fas fa-user-plus"></i> 用户名</label>
          <input
            v-model.trim="registerForm.username"
            class="ipt"
            type="text"
            placeholder="设置您的用户名"
            autocomplete="username"
          />
        </div>
        <div class="row">
          <label class="lbl"><i class="fas fa-envelope"></i> 邮箱</label>
          <input
            v-model.trim="registerForm.email"
            class="ipt"
            type="email"
            placeholder="请输入邮箱"
            autocomplete="email"
          />
        </div>
        <div class="row">
          <label class="lbl"><i class="fas fa-lock"></i> 密码</label>
          <div class="pw">
            <input
              v-model.trim="registerForm.password"
              class="ipt"
              :type="showRegisterPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="new-password"
            />
            <button type="button" class="toggle" @click="showRegisterPassword = !showRegisterPassword">
              <i class="fas" :class="showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>
        <div class="row">
          <label class="lbl"><i class="fas fa-lock"></i> 确认密码</label>
          <div class="pw">
            <input
              v-model.trim="registerForm.confirmPassword"
              class="ipt"
              :type="showRegisterConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
            <button type="button" class="toggle" @click="showRegisterConfirmPassword = !showRegisterConfirmPassword">
              <i class="fas" :class="showRegisterConfirmPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>

        <button class="wt-chip submit" :disabled="isRegistering">
          <i class="far fa-paper-plane"></i> {{ isRegistering ? '注册中…' : '注册' }}
        </button>
      </form>

      <footer class="foot">
        <router-link class="wt-chip wt-chip--sm" :to="{ name: 'Home' }">
          <i class="fas fa-home"></i> 返回首页
        </router-link>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// 使用现有的认证函数
import { login, register } from '../data/auth.js'

const router = useRouter()
const route = useRoute()

// 模式：login 或 register
const mode = ref('login')

// 表单与状态
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', password: '', email: '', confirmPassword: '' })
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirmPassword = ref(false)
const isLoggingIn = ref(false)
const isRegistering = ref(false)

const showLoginSuccess = ref(false)
const showRegisterSuccess = ref(false)
const showLoginError = ref(false)
const showRegisterError = ref(false)
const loginErrorMessage = ref('')
const registerErrorMessage = ref('')

// 初始化：根据查询参数或默认进入登录
onMounted(() => {
  const m = (route.query.mode || '').toString().toLowerCase()
  if (m === 'register') mode.value = 'register'
})

const switchMode = (m) => {
  mode.value = m
  // 同步地址栏 query（非必需）
  router.replace({ name: 'Login', query: m === 'register' ? { mode: 'register' } : {} })
}

// 登录
const handleLogin = async () => {
  const { username, password } = loginForm.value
  if (!username || !password) {
    showLoginError.value = true
    loginErrorMessage.value = '请输入账号和密码'
    setTimeout(() => (showLoginError.value = false), 2300)
    return
  }

  isLoggingIn.value = true
  try {
    const res = await login(username, password)
    if (res?.success) {
      localStorage.setItem('user_info', JSON.stringify(res.user))
      showLoginSuccess.value = true
      setTimeout(() => {
        showLoginSuccess.value = false
        router.replace({ name: 'Home' }).then(() => window.location.reload())
      }, 800)
    } else {
      showLoginError.value = true
      loginErrorMessage.value = res?.message || '登录失败'
      setTimeout(() => (showLoginError.value = false), 2300)
    }
  } catch (e) {
    showLoginError.value = true
    loginErrorMessage.value = '登录请求失败，请检查网络'
    setTimeout(() => (showLoginError.value = false), 2300)
  } finally {
    isLoggingIn.value = false
  }
}

// 注册
const handleRegister = async () => {
  const { username, password, email, confirmPassword } = registerForm.value
  if (!username || !password || !email || !confirmPassword) {
    showRegisterError.value = true
    registerErrorMessage.value = '请填写所有字段'
    setTimeout(() => (showRegisterError.value = false), 2300)
    return
  }
  if (password !== confirmPassword) {
    showRegisterError.value = true
    registerErrorMessage.value = '两次密码不一致'
    setTimeout(() => (showRegisterError.value = false), 2300)
    return
  }

  isRegistering.value = true
  try {
    const res = await register(username, password, email)
    if (res?.success) {
      showRegisterSuccess.value = true
      // 清空并切到登录
      registerForm.value = { username: '', password: '', email: '', confirmPassword: '' }
      setTimeout(() => {
        showRegisterSuccess.value = false
        switchMode('login')
      }, 900)
    } else {
      showRegisterError.value = true
      registerErrorMessage.value = res?.message || '注册失败'
      setTimeout(() => (showRegisterError.value = false), 2300)
    }
  } catch (e) {
    showRegisterError.value = true
    registerErrorMessage.value = '注册请求失败，请检查网络'
    setTimeout(() => (showRegisterError.value = false), 2300)
  } finally {
    isRegistering.value = false
  }
}

// 保留对外暴露，便于其他地方按需唤起此页并切换模式
const showLoginModal = () => {
  if (route.name !== 'Login') router.push({ name: 'Login' })
  switchMode('login')
}
const closeLoginModal = () => {
  router.push({ name: 'Home' })
}
defineExpose({ showLoginModal, closeLoginModal })
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.login-page{
  min-height: 100vh;
  padding: 120px 16px 40px;
  display: grid;
  place-items: start center;
  color: var(--wt-fg);
}

.login-card{
  width: min(600px, 96%);
  padding: 16px 16px 50px;
  animation: wt-appear .5s ease both;
}

.head{
  text-align: center;
  margin-bottom: 8px;
}
.title{
  margin: 0;
  font-weight: 800;
  font-size: clamp(24px, 4.4vw, 36px);
  letter-spacing: .5px;
  text-shadow: 0 10px 30px rgba(7,20,35,.45);
}
.sub{ margin: 4px 0 0; }

.tabs{
  display: flex; gap: 10px; justify-content: center;
  margin: 6px 0 10px;
}
.tab-chip{ min-width: 110px; justify-content: center; }

.form{ padding: 10px 4px 4px; }
.row{ margin: 10px 0; }
.lbl{ display: inline-flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ipt{
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--wt-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  color: var(--wt-fg);
  outline: none;
}
.pw{ position: relative; }
.toggle{
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  background: transparent; border: 0; color: var(--wt-fg); opacity: .8; cursor: pointer;
}

.submit{
  width: 40%;
  justify-content: center;
  margin-top: 6px;
}

.foot{
  display: flex; justify-content: center; margin-top: 8px;
}

/* 小屏优化 */
@media (max-width: 520px){
  .login-card{ padding: 14px 12px 10px; }
}

/* 登录/注册成功与错误提示（沿用全局类名，统一视觉） */
.global-login-success-toast,
.global-login-error-toast{
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 16px;
  border-radius: 999px;
  color: #fff;
  z-index: 4000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 30px rgba(7,20,35,.35);
  animation: globalFadeInOut 2.6s ease forwards;
}
.global-login-success-toast{ background-color: rgba(46,204,113,.92); }
.global-login-error-toast{ background-color: rgba(231,76,60,.92); }
@keyframes globalFadeInOut{
  0%{ opacity:0; transform: translate(-50%, -8px); }
  12%{ opacity:1; transform: translate(-50%, 0); }
  88%{ opacity:1; transform: translate(-50%, 0); }
  100%{ opacity:0; transform: translate(-50%, -8px); }
}
</style>

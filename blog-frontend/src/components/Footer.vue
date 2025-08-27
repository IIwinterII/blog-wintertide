<template>
  <footer class="site-footer wt-card">
    <div class="footer-inner">
      <div class="brand">
        <i class="fas fa-snowflake"></i>
        <span>Wintertide</span>
      </div>

      <div class="cols">
        <section class="col">
          <h3>关于 Wintertide</h3>
          <p>一个偏爱冬天与冰蓝拟态的个人技术博客。</p>
        </section>
        <section class="col">
          <h3>最新动态</h3>
          <p>界面重构，版本构成。</p>
        </section>
        <section class="col">
          <h3>联系</h3>
          <p>Email: 2488475799@qq.com</p>
        </section>
      </div>

      <nav class="links">
        <a href="https://github.com/IIwinterII/blog-wintertide" target="_blank" rel="noopener">GitHub</a>
        <a href="https://gitee.com/lwinterl" target="_blank" rel="noopener">Gitee</a>
        <router-link :to="{ name: 'Comments' }">留言</router-link>
      </nav>

      <div class="copy wt-muted">© {{ new Date().getFullYear() }} Wintertide</div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style src="../styles/theme.css"></style>
<style scoped>
.site-footer{
  width: min(1180px, 96%);
  margin: 36px auto 24px;
  padding: 18px 18px;
  animation: wt-appear .6s ease both;
}
.footer-inner{ display: grid; gap: 12px; }
.brand{ display:inline-flex; align-items:center; gap:8px; color: var(--wt-fg); font-weight:600; }

.cols{
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap:14px;
}
.col{
  padding:10px 12px;
  border-radius: var(--wt-radius-md);
  background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
  border: 1px solid var(--wt-border);
}
.col h3{ margin:0 0 6px; font-size:1.1rem; color: var(--wt-fg); }
.col p{ margin:0; color: var(--wt-fg-weak) }

.links{ display:flex; gap:12px; flex-wrap: wrap; margin-top: 6px; }
.links a, .links :deep(a){
  color: var(--wt-fg); text-decoration:none; opacity:.9;
  transition: transform .2s ease, opacity .2s ease;
}
.links a:hover, .links :deep(a:hover){ transform: translateY(-1px); opacity:1; }

.copy{ font-size:.92rem; }

@media (max-width: 880px){
  .cols{ grid-template-columns: 1fr; }
}
</style>
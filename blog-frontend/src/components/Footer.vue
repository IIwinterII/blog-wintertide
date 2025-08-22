<template>
 <!-- 页脚信息 -->
  <footer class="site-footer">
   <div class="footer-content">
    <div class="footer-section">
     <h3>关于Wintertide</h3>
      <p>Wintertide是一个专注于冬季主题的博客网站，分享冬季旅行、摄影、运动等精彩内容。</p>
       </div>
        <div class="footer-section">
         <h3>最新动态</h3>
          <p>版本 1.0.0 更新：全新界面设计，优化用户体验。</p>
           <p>2024年1月：新增文章分类功能。</p>
            </div>
             <div class="footer-section">
              <h3>联系我们</h3>
               <p>邮箱：contact@wintertide.com</p>
              <p>微信公众号：Wintertide</p>
             </div>
            </div>
           <div class="footer-bottom">
          <p>&copy; 2023-2024 Wintertide. 保留所有权利。</p>
         </div>
        </footer>
       </template>
<script setup>
// Footer组件不需要特别的逻辑
</script>

<style scoped>
/* 页脚样式：磨砂玻璃效果 */
.site-footer {
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  color: var(--text-light);
  border-radius: 20px;
  padding: 40px 0 0;
  position: relative;
  z-index: 3;
}

/* 页脚内容布局 */
.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 50px;
}

/* 页脚区块样式 */
.footer-section {
  margin-bottom: 30px;
}

.footer-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #fff;
}

.footer-section p {
  margin-bottom: 10px;
  line-height: 1.6;
}

/* 页脚底部样式 */
.footer-bottom {
  text-align: center;
  padding: 20px;
  border-top: 1px solid rgba(206, 232, 242, 0.753);
  margin-top: 30px;
}

/* 页脚响应式布局 */
@media (max-width: 768px) {
  .footer-content {
    padding: 0 20px;
    grid-template-columns: 1fr;
  }
}
/* 响应式布局：小屏幕 */
@media (max-width: 480px) {
  .nav-button {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }
  
  .search-input {
    padding: 0.6rem;
  }
}
/* 页脚样式：磨砂玻璃效果 */
.site-footer {
  background: rgba(133, 153, 199, 0.661);
  backdrop-filter: blur(15px);
  color: var(--text-light);
  border-radius: 20px;
  padding: 40px 0 0;
  position: relative;
  z-index: 3;
}

/* 页脚内容布局 */
.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 50px;
}

/* 页脚区块样式 */
.footer-section {
  margin-bottom: 30px;
}

.footer-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #fff;
}

.footer-section p {
  margin-bottom: 10px;
  line-height: 1.6;
}

/* 页脚底部样式 */
.footer-bottom {
  text-align: center;
  padding: 20px;
  border-top: 1px solid rgba(206, 232, 242, 0.753);
  margin-top: 30px;
}

/* 页脚响应式布局 */
@media (max-width: 768px) {
  .footer-content {
    padding: 0 20px;
    grid-template-columns: 1fr;
  }
}
/* 夜间模式样式调整 */
.night-mode .site-footer {
  background: rgba(86, 87, 88, 0.541) !important;
}

.night-mode .footer-section h3,
.night-mode .footer-section p {
  color: #d0d0d0 !important;
}

.night-mode .footer-bottom {
  border-top: 1px solid rgba(100, 100, 100, 0.5) !important;
}
</style>
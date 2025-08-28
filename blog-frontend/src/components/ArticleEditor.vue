<template>
  <div class="editor page">
    <!-- 头部 -->
    <section class="head wt-card">
      <h2 class="title">{{ isEdit ? '编辑文章' : '新增文章' }}</h2>
      <p class="sub wt-muted">为 Wintertide 写一篇新故事</p>
    </section>

    <!-- 表单 -->
    <section class="form wt-card">
      <div class="row">
        <label class="lbl">标题</label>
        <input v-model.trim="form.title" class="ipt" type="text" placeholder="输入文章标题" />
      </div>

      <div class="row">
        <label class="lbl">摘要</label>
        <input v-model.trim="form.summary" class="ipt" type="text" placeholder="一句话简介（选填）" />
      </div>

      <div class="row">
        <label class="lbl">封面地址</label>
        <div class="cover-input-group">
          <input v-model.trim="form.coverUrl" class="ipt" type="text" placeholder="图片 URL（选填）" />
          <input 
            type="file" 
            ref="coverFileInput" 
            accept="image/*" 
            style="display: none" 
            @change="handleCoverFileChange"
          />
          <button class="wt-chip wt-chip--sm" @click="$refs.coverFileInput.click()">
            <i class="fas fa-image"></i> 选择图片
          </button>
        </div>
      </div>

      <div class="row">
        <label class="lbl">标签</label>
        <input v-model.trim="tagsInput" class="ipt" type="text" placeholder="使用空格/逗号分隔，如：随笔 冬天 生活" />
      </div>

      <div class="row">
        <label class="lbl">正文</label>
        <!-- Quill 编辑器容器 -->
        <div class="quill-editor-container">
          <div class="quill-toolbar">
            <span class="ql-formats">
              <button class="ql-table" type="button" title="表格"></button>
            </span>
            <span class="ql-formats">
              <select class="ql-header">
                <option value="1">标题1</option>
                <option value="2">标题2</option>
                <option value="3">标题3</option>
                <option selected>正文</option>
              </select>
              <select class="ql-font">
                <option selected>默认</option>
                <option value="serif">衬线</option>
                <option value="monospace">等宽</option>
              </select>
              <select class="ql-size">
                <option value="small">小</option>
                <option selected>正常</option>
                <option value="large">大</option>
                <option value="huge">超大</option>
              </select>
            </span>
            <span class="ql-formats">
              <button class="ql-bold"></button>
              <button class="ql-italic"></button>
              <button class="ql-underline"></button>
              <button class="ql-strike"></button>
            </span>
            <span class="ql-formats">
              <select class="ql-color"></select>
              <select class="ql-background"></select>
            </span>
            <span class="ql-formats">
              <button class="ql-list" value="ordered"></button>
              <button class="ql-list" value="bullet"></button>
              <button class="ql-indent" value="-1"></button>
              <button class="ql-indent" value="+1"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-link"></button>
              <button class="ql-image"></button>
              <button class="ql-code-block"></button>
              <button class="ql-blockquote"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-clean"></button>
            </span>
          </div>
          <div ref="quillEditor" class="quill-editor"></div>
          <div class="editor-tips">
            <p class="tip"><i class="fas fa-lightbulb"></i> 提示：可以直接粘贴图片到编辑器中</p>
            <p class="tip"><i class="fas fa-arrows-alt"></i> 提示：插入图片后，点击图片可以调整大小</p>
          </div>
        </div>
      </div>

      <div class="ops">
        <button class="wt-chip" :disabled="saving" @click="save">
          <i class="far fa-save"></i> {{ saving ? '保存中…' : '保存' }}
        </button>
        <router-link class="wt-chip wt-chip--sm" :to="{ name: 'Home' }">
          <i class="fas fa-home"></i> 返回首页
        </router-link>
      </div>
    </section>

    <!-- 预览（可选） -->
    <section v-if="form.coverUrl" class="preview wt-card">
      <h3 class="pv-title">封面预览</h3>
      <div class="cover" :style="{ backgroundImage: `url(${form.coverUrl})` }"></div>
    </section>

    <!-- 提示（Teleport 到 body，避免被导航遮挡） -->
    <teleport to="body">
      <div v-if="toastText" class="toast wt-card" :class="toastType">
        <i v-if="toastType==='ok'" class="fas fa-check-circle"></i>
        <i v-else class="fas fa-exclamation-circle"></i>
        <span>{{ toastText }}</span>
      </div>

      <div v-if="tableModal.show" class="wt-modal-mask">
        <div class="wt-modal">
          <h3 class="wt-modal-title">插入表格</h3>
          <div class="wt-modal-body">
            <label>
              行数
              <input type="number" min="1" max="10" v-model.number="tableModal.rows" />
            </label>
            <label>
              列数
              <input type="number" min="1" max="10" v-model.number="tableModal.cols" />
            </label>
            <p class="wt-modal-tip">范围 1–10，默认 2×2</p>
          </div>
          <div class="wt-modal-actions">
            <button class="wt-chip" @click="confirmInsertTable">插入</button>
            <button class="wt-chip wt-chip--sm" @click="tableModal.show=false">取消</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '../utils/api'
import { uploadImage, getImageFromClipboard, fileToBase64 } from '../utils/imageUpload'
import Quill from 'quill'
import 'quill/dist/quill.snow.css' // 引入 Quill 样式
const DEFAULT_COVER = '/default-cover.jpg'

// 添加图片调整大小功能
function addImageResizeHandlers(quill) {
  // 当前正在调整大小的图片元素
  let resizingImg = null;
  // 初始尺寸和鼠标位置
  let startX, startY, startWidth, startHeight;
  
  // 点击图片时添加调整大小的功能
  quill.root.addEventListener('click', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
      const img = e.target;
      img.style.cursor = 'nwse-resize';
      img.setAttribute('contenteditable', 'false');
      img.setAttribute('draggable', 'false');
      
      // 如果图片没有宽度属性，设置当前宽度
      if (!img.getAttribute('width')) {
        img.setAttribute('width', img.clientWidth);
      }
    }
  });
  
  // 鼠标按下事件
  quill.root.addEventListener('mousedown', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
      e.preventDefault();
      resizingImg = e.target;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = resizingImg.clientWidth;
      startHeight = resizingImg.clientHeight;
      
      // 添加鼠标移动和松开事件
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  });
  
  // 处理鼠标移动
  const handleMouseMove = function(e) {
    if (!resizingImg) return;
    
    e.preventDefault();
    
    // 计算新的宽度和高度，保持宽高比
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + deltaX); // 最小宽度50px
    
    // 设置新的宽度
    resizingImg.setAttribute('width', newWidth);
    
    // 移除高度属性，让高度自动调整以保持宽高比
    resizingImg.removeAttribute('height');
  };
  
  // 处理鼠标松开
  const handleMouseUp = function() {
    resizingImg = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

const route = useRoute()
const router = useRouter()
const articleId = computed(() => route.params.id ? String(route.params.id) : null)
const isEdit = computed(() => !!articleId.value)

// 编辑器引用
const quillEditor = ref(null)
let quill = null

const form = reactive({
  title: '',
  summary: '',
  content: '',
  coverUrl: '',
  tags: [] // 数组形式提交
})

// 供输入的字符串形式
const tagsInput = ref('')
const coverFileInput = ref(null)
const tableModal = reactive({ show: false, rows: 2, cols: 2 })

const saving = ref(false)
const toastText = ref('')
const toastType = ref('ok') // ok / err
let toastTimer = null
const showToast = (text, type = 'ok', ms = 1600) => {
  toastText.value = text
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastText.value = ''), ms)
}

// 初始化 Quill 编辑器
const initQuill = () => {
  if (!quillEditor.value) return

  // 字体选项
  const fontAttributor = Quill.import('attributors/class/font')
  fontAttributor.whitelist = ['serif', 'monospace']
  Quill.register(fontAttributor, true)

  // 字号选项
  const sizeAttributor = Quill.import('attributors/style/size')
  sizeAttributor.whitelist = ['small', 'normal', 'large', 'huge']
  Quill.register(sizeAttributor, true)

  // 创建 Quill 实例
  quill = new Quill(quillEditor.value, {
    theme: 'snow',
    modules: {
      toolbar: '.quill-toolbar'
    },
    placeholder: '在这里书写你的内容…'
  })
  
  // 覆盖工具栏图片按钮为自定义上传
  const toolbar = quill.getModule('toolbar')
  if (toolbar) {
    toolbar.addHandler('image', imageHandler)
    toolbar.addHandler('table', tableHandler)
  }

  // 添加图片调整大小功能
  addImageResizeHandlers(quill);

  // 快捷键：引用、行内代码、代码块
  const fmt = () => quill.getFormat()
  quill.keyboard.addBinding({ key: 'B', shortKey: true, shiftKey: true }, () => {
    quill.format('blockquote', !fmt().blockquote)
  })
  quill.keyboard.addBinding({ key: 'E', shortKey: true }, () => {
    quill.format('code', !fmt().code)
  })
  quill.keyboard.addBinding({ key: 'C', shortKey: true, shiftKey: true }, () => {
    quill.format('code-block', !fmt()['code-block'])
  })

  // 注入工具栏按钮（若未存在）
  const toolbarEl = document.querySelector('.quill-toolbar')
  if (toolbarEl) {
    const ensureBtn = (cls, title, value) => {
      if (!toolbarEl.querySelector(value ? `button.${cls}[value="${value}"]` : `button.${cls}`)) {
        const btn = document.createElement('button')
        btn.className = cls
        btn.type = 'button'
        btn.title = title
        if (value != null) btn.setAttribute('value', value)
        toolbarEl.appendChild(btn)
      }
    }
    // 常用格式
    ensureBtn('ql-bold', '加粗')
    ensureBtn('ql-italic', '斜体')
    ensureBtn('ql-underline', '下划线')
    ensureBtn('ql-strike', '删除线')
    // 标题/列表
    ensureBtn('ql-header', '标题1', '1')
    ensureBtn('ql-header', '标题2', '2')
    ensureBtn('ql-list', '有序列表', 'ordered')
    ensureBtn('ql-list', '无序列表', 'bullet')
    // 对齐/链接/清除
    ensureBtn('ql-link', '链接')
    ensureBtn('ql-align', '居中', 'center')
    ensureBtn('ql-align', '右对齐', 'right')
    ensureBtn('ql-clean', '清除格式')
    // 引用/代码
    ensureBtn('ql-blockquote', '引用')
    ensureBtn('ql-code', '行内代码')
    ensureBtn('ql-code-block', '代码块')
    // 表格（简洁版）
    ensureBtn('ql-table', '表格')
  }

  // 监听内容变化，同步到 form.content
  quill.on('text-change', () => {
    form.content = quill.root.innerHTML
  })

  // 处理图片粘贴
  quill.root.addEventListener('paste', handlePaste)

  // 表格悬浮工具条：支持上下/左右添加行列
  let tableToolsEl = null
  let activeCell = null

  const ensureTableTools = () => {
    if (tableToolsEl) return
    tableToolsEl = document.createElement('div')
    tableToolsEl.className = 'table-tools'
    tableToolsEl.innerHTML = `
      <button data-act="row-above">上方+</button>
      <button data-act="row-below">下方+</button>
      <button data-act="col-left">左侧+</button>
      <button data-act="col-right">右侧+</button>
    `
    tableToolsEl.addEventListener('click', (e) => {
      const act = e.target && e.target.getAttribute('data-act')
      if (!act || !activeCell) return
      if (act === 'row-above') addRow(activeCell, 'above')
      else if (act === 'row-below') addRow(activeCell, 'below')
      else if (act === 'col-left') addCol(activeCell, 'left')
      else if (act === 'col-right') addCol(activeCell, 'right')
    })
    document.body.appendChild(tableToolsEl)
  }

  const positionTableTools = (td) => {
    if (!tableToolsEl) return
    const rect = td.getBoundingClientRect()
    tableToolsEl.style.display = 'flex'
    tableToolsEl.style.top = (window.scrollY + rect.top - tableToolsEl.offsetHeight - 6) + 'px'
    tableToolsEl.style.left = (window.scrollX + rect.left) + 'px'
  }
  const hideTableTools = () => { if (tableToolsEl) tableToolsEl.style.display = 'none' }

  const addRow = (cell, where) => {
    const tr = cell.closest('tr')
    if (!tr) return
    const row = tr.cloneNode(true)
    row.querySelectorAll('td,th').forEach(td => { td.textContent = '单元格' })
    if (where === 'above') tr.parentNode.insertBefore(row, tr)
    else tr.parentNode.insertBefore(row, tr.nextSibling)
    form.content = quill.root.innerHTML
  }

  const addCol = (cell, where) => {
    const tr = cell.closest('tr')
    if (!tr) return
    const idx = Array.from(tr.children).indexOf(cell)
    const table = tr.closest('table')
    table.querySelectorAll('tr').forEach(r => {
      const ref = r.children[idx] || r.lastElementChild
      const td = document.createElement(ref.tagName.toLowerCase())
      td.textContent = '单元格'
      if (where === 'left') r.insertBefore(td, ref)
      else r.insertBefore(td, ref.nextSibling)
    })
    form.content = quill.root.innerHTML
  }

  quill.root.addEventListener('click', (e) => {
    const td = e.target && e.target.closest && e.target.closest('td,th')
    if (td) { activeCell = td; ensureTableTools(); positionTableTools(td) }
    else { hideTableTools() }
  })

  // 选择高亮 + 右下角拖拽柄伸缩 + 删除整表（改进）
  let selectedWrap = null
  const editorContainerEl = document.querySelector('.quill-editor-container')
  const resizer = document.createElement('div')
  resizer.className = 'wt-table-resizer'
  if (editorContainerEl) editorContainerEl.appendChild(resizer)

  const placeResizerFor = (wrap) => {
    if (!editorContainerEl || !wrap) return
    const r = wrap.getBoundingClientRect()
    const c = editorContainerEl.getBoundingClientRect()
    resizer.style.left = (r.right - c.left - 8) + 'px'
    resizer.style.top = (r.bottom - c.top - 8) + 'px'
    resizer.classList.add('show')
  }

  quill.root.addEventListener('click', (e) => {
    const wrap = e.target && e.target.closest && e.target.closest('.wt-table-wrap')
    if (wrap) {
      if (selectedWrap && selectedWrap !== wrap) selectedWrap.classList.remove('selected')
      selectedWrap = wrap
      wrap.classList.add('selected')
      placeResizerFor(wrap)
    } else {
      if (selectedWrap) { selectedWrap.classList.remove('selected'); selectedWrap = null }
      resizer.classList.remove('show')
    }
  })

  let dragging = false, startX = 0, startY = 0, startW = 0, startH = 0
  const onMove = (e) => {
    if (!selectedWrap || !dragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const w = Math.max(120, startW + dx)
    const h = Math.max(60, startH + dy)
    selectedWrap.style.width = w + 'px'
    selectedWrap.style.height = h + 'px'
    placeResizerFor(selectedWrap)
    form.content = quill.root.innerHTML
  }
  const onUp = () => {
    dragging = false
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('mouseup', onUp, true)
  }
  resizer.addEventListener('mousedown', (e) => {
    if (!selectedWrap) return
    e.preventDefault()
    dragging = true
    startX = e.clientX
    startY = e.clientY
    startW = selectedWrap.offsetWidth
    startH = selectedWrap.offsetHeight
    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('mouseup', onUp, true)
  })

  // 捕获阶段监听，确保能拦截删除键
  const keydownHandler = (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedWrap) {
      e.preventDefault()
      const node = selectedWrap
      if (node && node.parentNode) node.parentNode.removeChild(node)
      selectedWrap = null
      resizer.classList.remove('show')
      form.content = quill.root.innerHTML
    }
  }
  document.addEventListener('keydown', keydownHandler, true)
}

/* 覆盖 Quill 图片按钮：统一走后端上传插入 URL */
const imageHandler = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files && input.files[0]
    if (!file) return
    try {
      showToast('图片上传中...', 'ok')
      const url = await uploadImage(file)
      const range = quill.getSelection(true)
      const idx = range ? range.index : quill.getLength()
      quill.insertEmbed(idx, 'image', url)
      quill.setSelection(idx + 1)
      showToast('图片已插入', 'ok')
    } catch (e) {
      console.error('图片上传失败:', e)
      showToast('图片上传失败', 'err')
    }
  }
  input.click()
}


const tableHandler = () => {
  tableModal.show = true;
};

const confirmInsertTable = () => {
  const clamp = n => Math.min(10, Math.max(1, parseInt(n, 10) || 2));
  const rows = clamp(tableModal.rows), cols = clamp(tableModal.cols);
  let body = '';
  for (let r = 0; r < rows; r++) {
    let t = '';
    for (let c = 0; c < cols; c++) t += '<td>单元格</td>';
    body += `<tr>${t}</tr>`;
  }
  const html = `<div class="wt-table-wrap"><table class="wt-table"><tbody>${body}</tbody></table></div>`;
  const sel = quill.getSelection(true);
  const idx = sel ? sel.index : quill.getLength();
  quill.clipboard.dangerouslyPasteHTML(idx, html);
  quill.setSelection(idx + 1);
  tableModal.show = false;
};

/* dataURL -> Blob */
const dataURLtoBlob = (dataurl) => {
  try {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new Blob([u8arr], { type: mime })
  } catch {
    return null
  }
}

/* 保存前：将内联图片(data:)上传并替换为 URL */
const ensureUploadedImagesBeforeSave = async () => {
  if (!quill) return
  const container = document.createElement('div')
  container.innerHTML = quill.root.innerHTML
  const imgs = Array.from(container.querySelectorAll('img[src^="data:image/"]'))
  for (const img of imgs) {
    const blob = dataURLtoBlob(img.src)
    if (!blob) continue
    const url = await uploadImage(blob)
    img.src = url
  }
  if (imgs.length) {
    quill.root.innerHTML = container.innerHTML
    form.content = quill.root.innerHTML
  }
}

// 处理粘贴事件
const handlePaste = async (e) => {
  const imageFile = getImageFromClipboard(e)
  if (!imageFile) return // 不是图片，使用默认粘贴行为

  e.preventDefault() // 阻止默认粘贴行为
  
  try {
    showToast('图片上传中...', 'ok')
    const range = quill.getSelection(true)
    
    // 先插入占位符
    quill.insertEmbed(range.index, 'image', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    quill.setSelection(range.index + 1)
    
    // 上传图片
    const imageUrl = await uploadImage(imageFile)
    
    // 替换占位符为实际图片
    quill.deleteText(range.index, 1)
    quill.insertEmbed(range.index, 'image', imageUrl)
    quill.setSelection(range.index + 1)
    
    showToast('图片已插入', 'ok')
  } catch (error) {
    console.error('图片粘贴失败:', error)
    showToast('图片插入失败', 'err')
  }
}

// 处理封面图片上传
const handleCoverFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件', 'err')
    return
  }
  
  try {
    showToast('封面上传中...', 'ok')
    const imageUrl = await uploadImage(file)
    form.coverUrl = imageUrl
    showToast('封面已上传', 'ok')
  } catch (error) {
    console.error('封面上传失败:', error)
    showToast('封面上传失败', 'err')
  } finally {
    // 清空文件输入，以便再次选择同一文件
    if (coverFileInput.value) {
      coverFileInput.value.value = ''
    }
  }
}

// 加载编辑数据
onMounted(async () => {
  // 初始化编辑器
  await nextTick()
  initQuill()
  
  if (!isEdit.value) {
    form.coverUrl = form.coverUrl || DEFAULT_COVER
    return
  }
  try {
    // 优先尝试 /articles/:id
    const res = await apiClient.get(`/articles/${articleId.value}`)
    const a = res.data || {}
    form.title = a.title || ''
    form.summary = a.description || a.summary || ''
    form.content = a.content || ''
    form.coverUrl = a.coverUrl || ''
    // 统一为数组
    const arr = Array.isArray(a.tags)
      ? a.tags
      : (a.tags ? String(a.tags).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean) : [])
    form.tags = arr
    tagsInput.value = arr.join(' ')
    
    // 设置编辑器内容
    if (quill && form.content) {
      quill.root.innerHTML = form.content
    }
  } catch (e) {
    // 回退：若后端无 /articles/:id，可从 /articles 列表中查
    try {
      const list = await apiClient.get('/articles')
      const target = (list.data || []).find(x => String(x.id) === articleId.value)
      if (target) {
        form.title = target.title || ''
        form.summary = target.description || target.summary || ''
        form.content = target.content || ''
        form.coverUrl = target.coverUrl || ''
        const arr = Array.isArray(target.tags)
          ? target.tags
          : (target.tags ? String(target.tags).split(/[\s,，#、/|]+/).map(s => s.trim()).filter(Boolean) : [])
        form.tags = arr
        tagsInput.value = arr.join(' ')
        
        // 设置编辑器内容
        if (quill && form.content) {
          quill.root.innerHTML = form.content
        }
      } else {
        showToast('未找到要编辑的文章', 'err', 2000)
      }
    } catch {
      showToast('加载文章失败', 'err', 2000)
    }
  }
})

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  if (quill && quill.root) {
    quill.root.removeEventListener('paste', handlePaste)
  }
})

// 保存
const save = async () => {
  if (!form.title.trim()) {
    showToast('请填写标题', 'err'); return
  }
  // 解析标签字符串到数组
  form.tags = String(tagsInput.value || '')
    .split(/[\s,，#、/|]+/)
    .map(s => s.trim())
    .filter(Boolean)

  saving.value = true
  try {
    // 保存前将内联图片上传并替换为 URL，避免内容过大
    await ensureUploadedImagesBeforeSave()
    const authorName = JSON.parse(localStorage.getItem('user_info') || '{}')?.username || 'Winter'
    
    // 使用 Date 对象而不是字符串
    const now = new Date()
    
    // 计算字数（去除HTML标签）
    const plainText = (form.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '')
    const wordCount = plainText.length
    
    const payload = {
      title: form.title,
      content: form.content || '',
      description: form.summary || '',
      publishDate: now, // 使用 Date 对象
      author: authorName,
      tags: (form.tags || []).join(' '),
      wordCount: wordCount,
      coverUrl: (isEdit.value ? (form.coverUrl || '') : (form.coverUrl || DEFAULT_COVER))
    }
    
    console.log('保存文章:', payload) // 调试用，可以在控制台查看发送的数据
    if (isEdit.value) {
      await apiClient.put(`/articles/${articleId.value}`, payload)
      showToast('已保存', 'ok')
    } else {
      const r = await apiClient.post('/articles', payload)
      showToast('已创建', 'ok')
      // 若返回了新 id，跳转到文章页
      const newId = r?.data?.id
      if (newId != null) {
        setTimeout(() => router.replace({ name: 'Article', params: { id: newId } }), 700)
      }
    }
  } catch (e) {
    console.error(e)
    showToast('保存失败，请稍后重试', 'err', 2000)
  } finally {
    saving.value = false
  }
}
</script>

<style>
/* 引用、代码显示样式（编辑/预览均生效） */
.ql-editor blockquote {
  border-left: 3px solid #8ec5ff;
  padding: 8px 12px;
  margin: 8px 0;
  color: #e6f0ff;
  background: rgba(142, 197, 255, 0);
  border-radius: 6px;
}
.ql-editor code {
  background: rgba(142, 197, 255, 0);
  padding: 2px 6px;
  border-radius: 4px;
}
.ql-editor pre, .ql-editor pre code {
  background: #0e1a2900;
  color: #e6f0ff;
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
}
/* 暗色编辑器主题与可读性优化 */
.quill-toolbar { 
  background: linear-gradient(145deg, rgba(13, 27, 42, 0.421), rgba(13, 27, 42, 0.452)); 
  backdrop-filter: blur(8px); 
  border-radius: 10px 10px 0 0; 
  padding: 8px; 
  border: 1px solid rgba(207,232,255,.28);
  color: #e6f0ff;
}
.quill-toolbar .ql-picker, 
.quill-toolbar .ql-stroke { color:#e6f0ff; stroke:#e6f0ff; }
.quill-toolbar .ql-fill { fill:#e6f0ff; }

.ql-container.ql-snow {
  background: rgba(13, 27, 42, 0); 
  border: 1px solid rgba(207,232,255,.28); 
  border-top: none; 
  border-radius: 0 0 10px 10px;
  color: #e6f0ff;
}
.ql-editor { 
  min-height: 320px; 
  line-height: 1.75; 
  color: #e6f0ff; 
}

/* 引用、代码显示样式（编辑/预览均生效） */
.ql-editor blockquote {
  border-left: 3px solid #8ec5ff;
  padding: 8px 12px;
  margin: 8px 0;
  color: #e6f0ff;
  background: rgba(142, 197, 255, .08);
  border-radius: 6px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.ql-editor code {
  background: rgba(142, 197, 255, .14);
  padding: 2px 6px;
  border-radius: 4px;
}
.ql-editor pre, .ql-editor pre code {
  background: #0e1a2900;
  color: #e6f0ff;
  padding: 12px;
  border-radius: 8px;
  overflow: auto;
}
/* 强制编辑器长行换行，避免溢出 */
.ql-editor,
.ql-editor p,
.ql-editor li {
  word-break: break-word;
  overflow-wrap: anywhere;
}
.ql-editor pre,
.ql-editor .ql-syntax,
.ql-editor pre code {
  white-space: pre-wrap !important;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow-x: visible;
}

</style>

<style src="../styles/theme.css"></style>
<style scoped>
.page{
  max-width: 1180px;
  margin: 0 auto;
  padding: 120px 16px 40px;
  color: var(--wt-fg);
}

/* 头部 */
.head{
  padding: 14px;
  margin-bottom: 12px;
}
.title{
  margin: 0 0 4px;
  font-size: clamp(20px, 3.8vw, 28px);
  font-weight: 700;
}
.sub{ margin: 0 }

/* 表单 */
.form{ padding: 14px; }
.row{ margin: 10px 0; }
.lbl{ display:block; margin-bottom: 6px; }
.ipt{
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--wt-border);
  background: linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
  color: var(--wt-fg);
  outline: none;
}
.ipt-area{ min-height: 260px; resize: vertical; }

/* 封面上传按钮组 */
.cover-input-group {
  display: flex;
  gap: 10px;
}

.cover-input-group .ipt {
  flex: 1;
}

/* Quill 编辑器容器 */
.quill-editor-container {
 background: linear-gradient(145deg, rgb(8, 15, 23));
 background: linear-gradient(145deg, #0d1b2ac4);
 
}

/* 自定义 Quill 工具栏 */
.quill-toolbar {
  border-bottom: 1px solid var(--wt-border);
  padding: 8px;
  background: linear-gradient(145deg, rgba(13, 27, 42, 0.236), rgba(13, 27, 42, 0.291));
}

/* 编辑器主体 */
.quill-editor {
  min-height: 260px;
  max-height: 600px;
  overflow-y: auto;
  padding: 12px;
}

/* 编辑器提示 */
.editor-tips {
  padding: 8px 12px;
  border-top: 1px solid var(--wt-border);
  background: rgba(245, 244, 244, 0.05);
}

.tip {
  font-size: 12px;
  color: var(--wt-muted, #a0aec0);
  margin: 0;
}

.tip i {
  margin-right: 4px;
  color: var(--wt-primary, #3498db);
}

.ops{
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-top: 10px;
}

/* 预览 */
.preview{ padding: 12px; margin-top: 12px; }
.pv-title{ margin: 0 0 8px; font-size: 1.1rem; }
.cover{
  width: 100%; aspect-ratio: 16 / 9;
  border-radius: 14px;
  background-size: cover; background-position: center;
  border: 1px solid rgba(207,232,255,0.28);
}

/* 提示 */
.toast{
  position: fixed;
  top: 18px; left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  display: inline-flex; align-items: center; gap: 8px;
  z-index: 3000;
}
.toast.ok{ color: #0d1b2a }
.toast.err{ color: #fff; background: rgba(231,76,60,.92) }

@media (max-width: 720px){
  .quill-editor { min-height: 200px; }
  
  /* 在移动设备上简化工具栏 */
  .ql-formats {
    margin-right: 5px !important;
  }
}
</style>

<!-- 全局 Quill 样式覆盖 -->
<style>
/* Quill 编辑器样式覆盖 */
.ql-toolbar.ql-snow {
  font-family: var(--wt-font, system-ui, sans-serif);
  border: none !important;
}

.ql-container.ql-snow {
  border: none !important;
  font-family: var(--wt-font, system-ui, sans-serif);
}

.ql-editor {
  color: var(--wt-fg, #e9ecef);
}

.ql-editor p {
  line-height: 1.6;
}

.ql-editor h1, .ql-editor h2, .ql-editor h3 {
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.ql-editor img {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px 0;
}

.ql-editor blockquote {
  border-left: 4px solid var(--wt-primary, #3498db);
  padding-left: 16px;
  color: var(--wt-muted, #a0aec0);
}

.ql-editor pre.ql-syntax {
  background-color: rgba(0, 0, 0, 0);
  color: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  overflow: auto;
}

/* 适配暗色模式 */
.ql-snow .ql-stroke {
  stroke: var(--wt-fg, #e9ecef);
}

.ql-snow .ql-fill {
  fill: var(--wt-fg, #e9ecef);
}

.ql-snow .ql-picker {
  color: var(--wt-fg, #e9ecef);
}

.ql-snow .ql-picker-options {
  background-color: var(--wt-bg-card, #1a1a2e);
  border-color: var(--wt-border, #2a2a3a);
}

.ql-snow .ql-tooltip {
  background-color: var(--wt-bg-card, #1a1a2e);
  border-color: var(--wt-border, #2a2a3a);
  color: var(--wt-fg, #e9ecef);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.ql-snow .ql-tooltip input[type=text] {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--wt-fg, #e9ecef);
  border-color: var(--wt-border, #2a2a3a);
}

/* 链接样式 */
.ql-snow .ql-tooltip a.ql-action,
.ql-snow .ql-tooltip a.ql-remove {
  color: var(--wt-primary, #3498db);
}

/* 按钮悬停效果 */
.ql-snow .ql-formats button:hover {
  color: var(--wt-primary, #3498db);
}

.ql-snow .ql-formats button:hover .ql-stroke {
  stroke: var(--wt-primary, #3498db);
}

.ql-snow .ql-formats button:hover .ql-fill {
  fill: var(--wt-primary, #3498db);
}

/* 选中状态 */
.ql-snow .ql-formats button.ql-active .ql-stroke {
  stroke: var(--wt-primary, #3498db);
}

.ql-snow .ql-formats button.ql-active .ql-fill {
  fill: var(--wt-primary, #3498db);
}

.ql-snow .ql-formats .ql-picker.ql-expanded .ql-picker-label {
  color: var(--wt-primary, #3498db);
}
</style>

<style>
/* 让空的 ql-table 按钮有文字可见 */
.quill-toolbar .ql-formats .ql-table, .quill-toolbar .ql-table{
  border:1px solid rgba(255,255,255,.28);
  border-radius:6px;
  height:26px; min-width:48px; padding:0 8px;
  color:#e6f0ff; background:transparent;
}
.quill-toolbar .ql-formats .ql-table::after, .quill-toolbar .ql-table::after{
  content:"表格"; font-size:12px; line-height:26px;
}

/* 禁用旧的悬浮表格工具（简洁版不需要） */
.table-tools{ display:none !important; }


/* 表格白色边框与暗色底 */
.ql-editor .wt-table,
.ql-editor table{
  border-collapse: separate;
  border-spacing: 0;
  border:1px solid rgba(255,255,255,.45);
  background: rgba(13,27,42,.60);
  border-radius:8px;
  overflow:hidden;
}
.ql-editor .wt-table td, .ql-editor .wt-table th,
.ql-editor table td, .ql-editor table th{
  border:1px solid rgba(255,255,255,.55);
  color:#e6f0ff;
  padding:6px 8px;
}

/* 可伸缩表格包裹容器 */
.ql-editor .wt-table-wrap{
  display:inline-block;
  max-width:100%;
  resize: both;
  overflow:auto;
  padding:6px;
  margin:6px 0;
  border-radius:8px;
}
.ql-editor .wt-table-wrap:hover{
  outline:1px dashed rgba(142,197,255,.45);
  outline-offset:2px;
}
.ql-editor .wt-table-wrap.selected{
  outline:2px solid rgba(142,197,255,.85);
  box-shadow:0 0 0 3px rgba(142,197,255,.18);
  outline-offset:2px;
}

/* 表格插入弹窗 */
.wt-modal-mask{
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display:flex; align-items:center; justify-content:center; z-index:4000;
}
.wt-modal{
  width: 320px; background: rgba(13,27,42,.96);
  border:1px solid rgba(207,232,255,.28); border-radius:12px; padding:14px;
  color:#e6f0ff;
}
.wt-modal-title{ margin:0 0 8px; font-size:16px; font-weight:600; }
.wt-modal-body{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
.wt-modal-body label{ display:flex; flex-direction:column; font-size:12px; gap:6px; }
.wt-modal-body input{ padding:6px 8px; border-radius:8px; border:1px solid rgba(207,232,255,.28); background:#0e1a29; color:#e6f0ff; }
.wt-modal-tip{ grid-column:1 / -1; margin:2px 0 0; font-size:12px; color:rgba(230,240,255,.7); }
.wt-modal-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
</style>

<style>
/* 选中高亮 + 拖拽柄样式 */
.quill-editor-container{ position: relative; }
.ql-editor .wt-table-wrap.selected{
  outline:2px solid rgba(142,197,255,.85);
  box-shadow:0 0 0 3px rgba(142,197,255,.18);
  outline-offset:2px;
}
.wt-table-resizer{
  position:absolute; width:12px; height:12px; border-radius:50%;
  background:#8ec5ff; border:2px solid rgba(255,255,255,.9);
  box-shadow:0 2px 8px rgba(0,0,0,.3);
  cursor:nwse-resize; z-index: 2000; display:none;
}
.wt-table-resizer.show{ display:block; }
</style>

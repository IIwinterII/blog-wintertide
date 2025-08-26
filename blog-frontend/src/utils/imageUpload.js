/**
 * 图片上传工具
 * 支持粘贴上传、拖拽上传和文件选择上传
 * 增加了大图片压缩功能
 */

import apiClient from './api';

/**
 * 将 File/Blob 对象转换为 base64 字符串
 * @param {File|Blob} file - 文件对象
 * @returns {Promise<string>} base64字符串
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * 压缩图片
 * @param {File|Blob} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度（像素）
 * @param {number} maxHeight - 最大高度（像素）
 * @param {number} quality - 压缩质量 (0-1)
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export const compressImage = (file, maxWidth = 1600, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 计算缩放比例
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        if (height > maxHeight) {
          const ratio = maxHeight / height;
          height = maxHeight;
          width = width * ratio;
        }
        
        // 创建Canvas并绘制缩小后的图片
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为Blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`图片已压缩: ${(file.size / 1024).toFixed(2)}KB -> ${(blob.size / 1024).toFixed(2)}KB`);
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        }, file.type, quality);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
};

/**
 * 上传图片到服务器
 * 使用后端文件系统存储，不再使用base64回退方案
 * 大图片会自动压缩
 * 
 * @param {File|Blob} file - 图片文件
 * @returns {Promise<string>} 图片URL
 */
export const uploadImage = async (file) => {
  try {
    // 检查文件大小，如果超过2MB则压缩
    let imageToUpload = file;
    if (file.size > 2 * 1024 * 1024) {
      console.log(`图片过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，进行压缩...`);
      imageToUpload = await compressImage(file);
    }
    
    // 创建 FormData
    const formData = new FormData();
    formData.append('image', imageToUpload);
    
    // 调用后端上传接口
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 增加超时时间到30秒
    });
    
    // 如果上传成功，返回图片URL
    if (response.data && response.data.url) {
      console.log('图片上传成功:', response.data.url);
      return response.data.url;
    }
    throw new Error('上传失败: 服务器未返回有效URL');
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
};

/**
 * 从剪贴板事件中提取图片文件
 * @param {ClipboardEvent} e - 剪贴板事件
 * @returns {File|null} 图片文件或null
 */
export const getImageFromClipboard = (e) => {
  if (e.clipboardData && e.clipboardData.items) {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        return items[i].getAsFile();
      }
    }
  }
  return null;
};
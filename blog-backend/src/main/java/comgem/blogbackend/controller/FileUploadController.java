package comgem.blogbackend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Value("${file.upload-dir:upload}")
    private String uploadDir;

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile file) {
        try {
            // 记录文件信息
            System.out.println("接收到文件上传请求:");
            System.out.println("文件名: " + file.getOriginalFilename());
            System.out.println("文件大小: " + (file.getSize() / 1024) + " KB");
            System.out.println("文件类型: " + file.getContentType());
            
            // 获取当前工作目录
            String currentDir = System.getProperty("user.dir");
            System.out.println("当前工作目录: " + currentDir);
            
            // 创建上传目录（如果不存在）- 使用绝对路径
            File directory = new File(currentDir, uploadDir);
            System.out.println("上传目录: " + directory.getAbsolutePath());
            
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                System.out.println("创建目录结果: " + created);
                if (!created) {
                    throw new IOException("无法创建上传目录: " + directory.getAbsolutePath());
                }
            }

            // 检查目录是否可写
            if (!directory.canWrite()) {
                throw new IOException("上传目录没有写入权限: " + directory.getAbsolutePath());
            }

            // 生成唯一文件名（避免文件名冲突）
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            
            // 保存文件
            Path filePath = Paths.get(directory.getAbsolutePath(), newFilename);
            System.out.println("保存文件路径: " + filePath);
            
            try {
                Files.write(filePath, file.getBytes());
                System.out.println("文件保存成功: " + filePath);
            } catch (IOException e) {
                System.err.println("文件写入失败: " + e.getMessage());
                e.printStackTrace();
                throw new IOException("文件写入失败: " + e.getMessage(), e);
            }
            
            // 构建访问URL
            String fileUrl = "/api/upload/" + newFilename;
            System.out.println("生成的文件URL: " + fileUrl);
            
            // 返回文件URL
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("文件上传失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("未预期的错误: " + e.getMessage());
            return ResponseEntity.internalServerError().body("未预期的错误: " + e.getMessage());
        }
    }
}
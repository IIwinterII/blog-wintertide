package comgem.blogbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:upload}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            // 获取当前工作目录
            String currentDir = System.getProperty("user.dir");
            System.out.println("WebMvcConfig - 当前工作目录: " + currentDir);
            
            // 构建上传目录的绝对路径
            File directory = new File(currentDir, uploadDir);
            String uploadAbsolutePath = directory.getAbsolutePath();
            System.out.println("WebMvcConfig - 上传目录绝对路径: " + uploadAbsolutePath);
            
            // 确保目录存在
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                System.out.println("WebMvcConfig - 创建目录结果: " + created);
            }
            
            // 将 /api/upload/** 映射到文件系统中的上传目录
            registry.addResourceHandler("/api/upload/**")
                    .addResourceLocations("file:" + uploadAbsolutePath + "/");
            
            System.out.println("WebMvcConfig - 静态资源映射已配置: /api/upload/** -> " + uploadAbsolutePath);
        } catch (Exception e) {
            System.err.println("WebMvcConfig - 配置静态资源映射时出错: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
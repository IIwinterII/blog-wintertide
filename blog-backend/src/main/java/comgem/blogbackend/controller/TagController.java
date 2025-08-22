// 文件: blog-backend/src/main/java/comgem/blogbackend/controller/TagController.java
package comgem.blogbackend.controller;

import comgem.blogbackend.repository.ArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {
    @Autowired
    private ArticleRepository articleRepository;

    // 获取所有唯一标签
    @GetMapping
    public List<String> getAllTags() {
        return articleRepository.findAllDistinctTags();
    }
}

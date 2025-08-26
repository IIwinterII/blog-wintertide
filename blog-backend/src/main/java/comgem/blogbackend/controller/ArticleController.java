package comgem.blogbackend.controller;

import comgem.blogbackend.entity.Article;
import comgem.blogbackend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {
    @Autowired
    private ArticleService articleService;

    @GetMapping
    public List<Article> getAllArticles() {
        return articleService.getAllArticles();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
        Article article = articleService.getArticleById(id);
        return ResponseEntity.ok(article);
    }

    @PostMapping
    public ResponseEntity<?> createArticle(@RequestBody Article article) {
        try {
            System.out.println("接收到文章创建请求: " + article.getTitle());
            System.out.println("日期: " + article.getPublishDate());
            System.out.println("内容长度: " + (article.getContent() != null ? article.getContent().length() : 0));
            
            Article savedArticle = articleService.createArticle(article);
            System.out.println("文章创建成功，ID: " + savedArticle.getId());
            return ResponseEntity.ok(savedArticle);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("文章创建失败: " + e.getMessage());
            return ResponseEntity.status(500).body("文章创建失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Article> updateArticle(
            @PathVariable Long id,
            @RequestBody Article articleDetails) {
        return ResponseEntity.ok(articleService.updateArticle(id, articleDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}
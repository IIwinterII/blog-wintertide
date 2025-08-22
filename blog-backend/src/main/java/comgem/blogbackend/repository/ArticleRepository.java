package comgem.blogbackend.repository;

import comgem.blogbackend.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

// ✅ 正确示例：操作 Article 实体
@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByAuthor(String author);
    List<Article> findByTags(String tags); // 按单个标签查询
    // 文件: blog-backend/src/main/java/comgem/blogbackend/repository/ArticleRepository.java
    @Query(value = "SELECT DISTINCT tags FROM articles WHERE tags IS NOT NULL", nativeQuery = true)
    List<String> findAllDistinctTags();

}


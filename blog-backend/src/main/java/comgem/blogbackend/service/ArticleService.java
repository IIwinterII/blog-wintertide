
package comgem.blogbackend.service;

import comgem.blogbackend.entity.Article;
import java.util.List;

public interface ArticleService {
    List<Article> getAllArticles();
    Article getArticleById(Long id);
    Article createArticle(Article article);
    Article updateArticle(Long id, Article articleDetails);
    void deleteArticle(Long id);
}

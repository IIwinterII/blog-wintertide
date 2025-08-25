package comgem.blogbackend.service.impl;

import comgem.blogbackend.entity.Article;
import comgem.blogbackend.repository.ArticleRepository;
import comgem.blogbackend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service // 标记为Spring服务Bean
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Override
    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    @Override
    public Article getArticleById(Long id) {
        return articleRepository.findById(id).orElse(null);
    }

    @Override
    public Article createArticle(Article article) {
        return articleRepository.save(article);
    }

    @Override
    public Article updateArticle(Long id, Article articleDetails) {
        Article article = getArticleById(id);
        if (article != null) {
            article.setTitle(articleDetails.getTitle());
            article.setContent(articleDetails.getContent());
            article.setDescription(articleDetails.getDescription());
            article.setPublishDate(articleDetails.getPublishDate());
            article.setAuthor(articleDetails.getAuthor());
            article.setTags(articleDetails.getTags());
            article.setWordCount(articleDetails.getWordCount());
            return articleRepository.save(article);
        }
        return null;
    }

    @Override
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
}

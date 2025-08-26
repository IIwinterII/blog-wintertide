package comgem.blogbackend.service.impl;

import comgem.blogbackend.entity.Article;
import comgem.blogbackend.repository.ArticleRepository;
import comgem.blogbackend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
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
        try {
            // 检查日期是否为空
            if (article.getPublishDate() == null) {
                // 如果为空，设置为当前日期
                article.setPublishDate(new Date());
            } else if (article.getPublishDate() instanceof java.util.Date) {
                // 如果已经是Date类型，不需要处理
                System.out.println("日期已经是Date类型: " + article.getPublishDate());
            } else {
                // 如果是其他类型（如字符串），尝试转换
                System.out.println("尝试转换日期: " + article.getPublishDate() + ", 类型: " + article.getPublishDate().getClass().getName());
            }
            
            // 确保其他必填字段不为空
            if (article.getTitle() == null || article.getTitle().isEmpty()) {
                throw new IllegalArgumentException("标题不能为空");
            }
            
            if (article.getContent() == null) {
                article.setContent("");
            }
            
            if (article.getDescription() == null) {
                article.setDescription("");
            }
            
            if (article.getAuthor() == null || article.getAuthor().isEmpty()) {
                article.setAuthor("匿名");
            }
            
            if (article.getWordCount() == null) {
                article.setWordCount(0);
            }
            
            return articleRepository.save(article);
        } catch (Exception e) {
            System.err.println("创建文章失败: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
            article.setCoverUrl(articleDetails.getCoverUrl()); // 添加封面URL更新
            return articleRepository.save(article);
        }
        return null;
    }

    @Override
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
}

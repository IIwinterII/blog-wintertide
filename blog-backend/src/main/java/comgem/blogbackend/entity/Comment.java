package comgem.blogbackend.entity;

import java.util.Date;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 数据库为 varchar(255)，这里与表结构保持一致
    @Column(nullable = false, length = 255)
    private String content;

    // 映射到 created_at 列，插入时自动填充
    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createTime;

    // 映射到 user_id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 映射到 article_id
    @Column(name = "article_id", nullable = false)
    private Long articleId;

    @Column(nullable = false)
    private String username; // 冗余字段，方便查询

    // Constructors
    public Comment() {}

    public Comment(String content, Date createTime, Long userId, Long articleId, String username) {
        this.content = content;
        this.createTime = createTime;
        this.userId = userId;
        this.articleId = articleId;
        this.username = username;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getArticleId() { return articleId; }
    public void setArticleId(Long articleId) { this.articleId = articleId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}

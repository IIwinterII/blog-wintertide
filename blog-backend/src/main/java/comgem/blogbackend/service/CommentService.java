// CommentService.java
package comgem.blogbackend.service;

import java.util.List;

import comgem.blogbackend.entity.Comment;

public interface CommentService {
    Comment addComment(Comment comment);
    List<Comment> getCommentsByArticleId(Long articleId);
    void deleteComment(Long id);
}
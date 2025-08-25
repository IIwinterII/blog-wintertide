package comgem.blogbackend.service.impl;

import comgem.blogbackend.entity.Comment;
import comgem.blogbackend.repository.CommentRepository;
import comgem.blogbackend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Override
    public Comment addComment(Comment comment) {
        return commentRepository.save(comment);
    }

    @Override
    public List<Comment> getCommentsByArticleId(Long articleId) {
        return commentRepository.findByArticleId(articleId);
    }

    @Override
    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }
}
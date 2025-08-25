package comgem.blogbackend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import comgem.blogbackend.entity.Comment;
import comgem.blogbackend.service.CommentService;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    // 获取文章评论
    @GetMapping("/article/{articleId}")
    public ResponseEntity<List<Comment>> getCommentsByArticleId(@PathVariable Long articleId) {
        List<Comment> comments = commentService.getCommentsByArticleId(articleId);
        return ResponseEntity.ok(comments);
    }

    // 添加评论
    @PostMapping
    public ResponseEntity<Map<String, Object>> addComment(@RequestBody Comment comment) {
        Map<String, Object> response = new HashMap<>();
        try {
            Comment savedComment = commentService.addComment(comment);
            response.put("success", true);
            response.put("message", "评论添加成功");
            response.put("comment", savedComment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "评论添加失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // 删除评论
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            commentService.deleteComment(id);
            response.put("success", true);
            response.put("message", "评论删除成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "评论删除失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
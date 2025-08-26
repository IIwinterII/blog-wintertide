package comgem.blogbackend.controller;

import comgem.blogbackend.entity.Article;
import comgem.blogbackend.entity.Favorite;
import comgem.blogbackend.repository.ArticleRepository;
import comgem.blogbackend.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @Autowired
    private ArticleRepository articleRepository;

    // 简单 DTO：返回收藏以及关联文章标题
    public static class FavoriteDTO {
        private Long id;
        private Long articleId;
        private String title;
        private String username;
        private Date createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getArticleId() { return articleId; }
        public void setArticleId(Long articleId) { this.articleId = articleId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public Date getCreatedAt() { return createdAt; }
        public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    }

    private FavoriteDTO toDTO(Favorite f) {
        FavoriteDTO dto = new FavoriteDTO();
        dto.setId(f.getId());
        dto.setArticleId(f.getArticleId());
        dto.setUsername(f.getUsername());
        dto.setCreatedAt(f.getCreatedAt());
        articleRepository.findById(f.getArticleId()).ifPresent(a -> dto.setTitle(a.getTitle()));
        return dto;
    }

    // 列表：按用户名查询收藏（倒序）
    @GetMapping
    public ResponseEntity<List<FavoriteDTO>> list(@RequestParam("username") String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Favorite> list = favoriteService.listByUsername(username.trim());
        // 为减少 N+1，可一次性取出涉及的文章标题
        Set<Long> ids = list.stream().map(Favorite::getArticleId).collect(Collectors.toSet());
        Map<Long, String> titleMap = new HashMap<>();
        if (!ids.isEmpty()) {
            articleRepository.findAllById(ids).forEach(a -> titleMap.put(a.getId(), a.getTitle()));
        }
        List<FavoriteDTO> res = list.stream().map(f -> {
            FavoriteDTO dto = new FavoriteDTO();
            dto.setId(f.getId());
            dto.setArticleId(f.getArticleId());
            dto.setUsername(f.getUsername());
            dto.setCreatedAt(f.getCreatedAt());
            dto.setTitle(titleMap.getOrDefault(f.getArticleId(), null));
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }

    // 新增（幂等）：body: { username, articleId }
    @PostMapping
    public ResponseEntity<FavoriteDTO> add(@RequestBody Map<String, Object> body) {
        try {
            String username = Objects.toString(body.get("username"), "").trim();
            Object aidObj = body.get("articleId");
            Long articleId = aidObj instanceof Number ? ((Number) aidObj).longValue() : Long.parseLong(String.valueOf(aidObj));
            if (username.isEmpty() || articleId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            Favorite saved = favoriteService.addFavorite(username, articleId);
            FavoriteDTO dto = toDTO(saved);
            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // 删除：/api/favorites?username=xxx&articleId=123
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> remove(@RequestParam("username") String username,
                                                @RequestParam("articleId") Long articleId) {
        if (username == null || username.trim().isEmpty() || articleId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        boolean ok = favoriteService.removeFavorite(username.trim(), articleId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", ok);
        return ResponseEntity.ok(res);
    }

    // 判定是否收藏：/api/favorites/check?username=xxx&articleId=123
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> check(@RequestParam("username") String username,
                                               @RequestParam("articleId") Long articleId) {
        if (username == null || username.trim().isEmpty() || articleId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        boolean fav = favoriteService.isFavorite(username.trim(), articleId);
        Map<String, Object> res = new HashMap<>();
        res.put("favorite", fav);
        return ResponseEntity.ok(res);
    }
}
package comgem.blogbackend.repository;

import comgem.blogbackend.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findAllByUsernameOrderByCreatedAtDesc(String username);
    boolean existsByUsernameAndArticleId(String username, Long articleId);
    Optional<Favorite> findByUsernameAndArticleId(String username, Long articleId);
    long deleteByUsernameAndArticleId(String username, Long articleId);
}
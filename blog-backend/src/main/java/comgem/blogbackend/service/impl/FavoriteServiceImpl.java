package comgem.blogbackend.service.impl;

import comgem.blogbackend.entity.Favorite;
import comgem.blogbackend.repository.FavoriteRepository;
import comgem.blogbackend.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Override
    public List<Favorite> listByUsername(String username) {
        return favoriteRepository.findAllByUsernameOrderByCreatedAtDesc(username);
    }

    @Override
    @Transactional
    public Favorite addFavorite(String username, Long articleId) {
        Optional<Favorite> exists = favoriteRepository.findByUsernameAndArticleId(username, articleId);
        if (exists.isPresent()) {
            return exists.get(); // 幂等：已存在则直接返回
        }
        Favorite f = new Favorite(username, articleId);
        return favoriteRepository.save(f);
    }

    @Override
    @Transactional
    public boolean removeFavorite(String username, Long articleId) {
        long n = favoriteRepository.deleteByUsernameAndArticleId(username, articleId);
        return n > 0;
    }

    @Override
    public boolean isFavorite(String username, Long articleId) {
        return favoriteRepository.existsByUsernameAndArticleId(username, articleId);
    }
}
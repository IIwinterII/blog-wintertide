package comgem.blogbackend.service;

import comgem.blogbackend.entity.Favorite;

import java.util.List;

public interface FavoriteService {
    List<Favorite> listByUsername(String username);
    Favorite addFavorite(String username, Long articleId);
    boolean removeFavorite(String username, Long articleId);
    boolean isFavorite(String username, Long articleId);
}
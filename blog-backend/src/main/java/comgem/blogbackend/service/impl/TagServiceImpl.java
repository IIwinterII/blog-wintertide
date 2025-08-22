package comgem.blogbackend.service.impl;

import comgem.blogbackend.repository.ArticleRepository;
import comgem.blogbackend.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TagServiceImpl implements TagService {
    @Autowired
    private ArticleRepository articleRepository;

    @Override
    public List<String> getAllTags() {
        List<String> allTags = articleRepository.findAllDistinctTags();
        Set<String> uniqueTags = new HashSet<>();

        for (String tags : allTags) {
            if (tags != null && !tags.isEmpty()) {
                String[] tagArray = tags.split(",");
                for (String tag : tagArray) {
                    String trimmed = tag.trim();
                    if (!trimmed.isEmpty()) {
                        uniqueTags.add(trimmed);
                    }
                }
            }
        }

        return new ArrayList<>(uniqueTags);
    }
}

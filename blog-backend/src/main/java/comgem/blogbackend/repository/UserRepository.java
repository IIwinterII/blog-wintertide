// UserRepository.java
package comgem.blogbackend.repository;

import comgem.blogbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
    // 移除 findByUsernameAndPassword 方法
}

// UserServiceImpl.java
package comgem.blogbackend.service.impl;

import comgem.blogbackend.dto.LoginRequest;
import comgem.blogbackend.entity.User;
import comgem.blogbackend.repository.UserRepository;
import comgem.blogbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public User login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername());
        if (user != null && passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return user;
        }
        return null;
    }

    @Override
    public User register(String username, String password, String email) {
        // 检查用户名是否已存在
        if (userRepository.findByUsername(username) != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.findByEmail(email) != null) {
            throw new RuntimeException("邮箱已被注册");
        }

        // 创建新用户
        User newUser = new User();
        newUser.setUsername(username);
        // 加密密码
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setEmail(email);

        // 保存用户
        return userRepository.save(newUser);
    }
}

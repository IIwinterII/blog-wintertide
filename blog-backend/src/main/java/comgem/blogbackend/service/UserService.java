// UserService.java
package comgem.blogbackend.service;

import comgem.blogbackend.dto.LoginRequest;
import comgem.blogbackend.entity.User;

import java.util.Map;

public interface UserService {
    User login(LoginRequest loginRequest);
    User register(String username, String password, String email);
}

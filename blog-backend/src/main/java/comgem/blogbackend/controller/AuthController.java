// AuthController.java
package comgem.blogbackend.controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// 添加以下导入
import org.springframework.http.HttpStatus;

import comgem.blogbackend.dto.LoginRequest;
import comgem.blogbackend.entity.User;
import comgem.blogbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class); // 添加这一行
    @Autowired
    private UserService userService;

    // 登录端点
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        LoginRequest loginRequest = new LoginRequest(username, password);
        User user = userService.login(loginRequest);

        Map<String, Object> response = new HashMap<>();

        if (user != null) {
            response.put("success", true);
            response.put("message", "登录成功");
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            response.put("user", userInfo);
        } else {
            response.put("success", false);
            response.put("message", "用户名或密码错误");
        }

        return ResponseEntity.ok(response);
    }

    // 注册端点
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> userData) {
        String username = userData.get("username");
        String password = userData.get("password");
        String email = userData.get("email");

        Map<String, Object> response = new HashMap<>();

        try {
            User registeredUser = userService.register(username, password, email);

            response.put("success", true);
            response.put("message", "注册成功");
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", registeredUser.getId());
            userInfo.put("username", registeredUser.getUsername());
            userInfo.put("email", registeredUser.getEmail());
            response.put("user", userInfo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("注册失败", e); // 添加日志记录
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

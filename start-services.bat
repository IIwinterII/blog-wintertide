@echo off
echo 启动 Wintertide 博客系统...

REM 创建上传目录（如果不存在）
if not exist "upload" mkdir upload

REM 启动后端服务
echo 启动 Spring Boot 后端服务...
start cmd /k "cd blog-backend && mvn spring-boot:run"

REM 等待后端启动
echo 等待后端服务启动...
timeout /t 10

REM 启动前端服务
echo 启动 Vue 前端服务...
start cmd /k "cd blog-frontend && npm run dev"

echo 服务启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8080
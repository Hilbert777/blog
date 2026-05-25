# 博客前台后台系统

这是一个以前端实践为主的博客系统。当前默认采用“纯前端运行”方案，所有文章、分类和登录数据都保存在浏览器 `localStorage` 中，不需要启动 Java 后端、不需要 Maven，也不需要 MySQL。


## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Element Plus
- md-editor-v3
- localStorage Mock API

## 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问地址：

- 前台首页：`http://localhost:5173/`
- 后台登录：`http://localhost:5173/login`

## 测试账号

- 账号：`admin`
- 密码：`123456`

## 数据说明

首次打开页面时，前端会自动向 `localStorage` 写入演示数据：

- 管理员账号
- 默认分类和从旧博客文章中解析出的分类
- 2 篇项目示例文章
- 从 `D:\blog\HilbertBlog\source\_posts` 搬运的 9 篇历史文章，不包含 `Self-Introduction.md`

后台新增、编辑、删除的文章和分类也会保存在 `localStorage` 中。清空浏览器站点数据后，系统会重新生成默认演示数据。

## 可选后端

`backend/` 中保留了一套 Spring Boot + MyBatis-Plus + JWT 示例接口。如果后续课程要求真实接口联调，可以安装 Maven 和 MySQL 后再启用后端。

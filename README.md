# Hilbert's Blog

Hilbert's Blog 是一个以前端实践为主的个人博客项目。当前版本采用纯前端运行方案，不依赖后端服务和数据库，文章、分类、登录状态等演示数据通过浏览器 `localStorage` 模拟保存。

页面已部署在Vercel：https://blog-ashen-nu.vercel.app/

这个blog主要用于天津大学软件工程专业前端开发综合实践作业展示，部分内容沿用了我之前使用Hexo + GitHub Pages 搭建的个人博客：https://hilbert777.github.io。如果您对我的文章感兴趣，欢迎访问我的博客继续交流！

## 功能特性

- 前台首页、文章列表、文章详情页
- 最新文章跳转、导航栏文章跳转、文章卡片跳转
- 文章分类筛选和关键词搜索
- 后台登录、文章管理、文章新增/编辑/删除
- 后台自定义分类新增、编辑、删除
- Markdown 文章编辑和展示
- 明亮/黑夜模式切换
- 作者信息展示

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Element Plus
- lucide-vue-next
- md-editor-v3
- localStorage Mock API

## 项目结构

```text
blog/
|-- frontend/                 # 前端项目，Vercel 部署根目录
|   |-- public/images/         # 头像、图标、背景图、文章图片
|   |-- src/api/               # 前端 API 封装
|   |-- src/components/        # 公共组件和文章组件
|   |-- src/content/posts/     # 内置 Markdown 文章
|   |-- src/layouts/           # 前台/后台布局
|   |-- src/mock/              # localStorage Mock 数据层
|   |-- src/router/            # 路由配置
|   |-- src/stores/            # Pinia 状态管理
|   |-- src/styles/            # 全局样式
|   |-- src/views/             # 页面视图
|   `-- vercel.json            # Vercel 前端路由回退配置
|-- README.md
`-- .gitignore
```

## 本地运行

进入前端目录：

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：

- 前台首页：`http://localhost:5173/`
- 文章列表：`http://localhost:5173/articles`
- 后台登录：`http://localhost:5173/login`

## 后台测试账号

```text
账号：admin
密码：123456
```

登录页不会自动填充管理员账号和密码，需要手动输入。

## 数据存储

当前项目不需要启动后端。首次打开页面时，前端会自动向 `localStorage` 写入默认数据。

主要本地存储键：

- `blog_frontend_mock_db_v2`：文章、分类、用户等 Mock 数据
- `blog_admin_token`：后台登录 token
- `blog_theme_mode`：明亮/黑夜主题

如果需要恢复默认演示数据，可以在浏览器开发者工具中清理当前站点的 localStorage，然后刷新页面。

## 构建

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist/`。该目录不会提交到 Git。

本地预览生产构建：

```bash
npm run preview
```

## Vercel 部署

在 Vercel 导入 GitHub 仓库后，使用以下配置：

```text
Framework Preset: Vite
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
Environment Variables: 不需要配置
```

根目录 `vercel.json` 已配置从仓库根目录进入 `frontend` 构建，并发布 `frontend/dist`。`frontend/vercel.json` 保留了当前端目录作为 Vercel Root Directory 时的 SPA 路由回退配置。部署后直接刷新 `/articles` 或 `/articles/:id` 不会出现 404。

# yunli2024.github.io

这是一个基于静态 GitHub Pages 的个人网站样板，包含：

- `index.html`：主页，带右上角菜单和站点导航。
- `blog.html`：博客列表页，从 `posts/index.json` 读取文章列表。
- `post.html`：文章查看页，支持读取并渲染 Markdown 文件。
- `editor.html`：客户端 Markdown 编辑器，带实时预览、下载 `.md` 和复制 HTML 功能。
- `posts/`：文章目录（包含示例文章 `sample-post.md` 和 `index.json`）。

快速开始：

1. 将本仓库推送到 GitHub（仓库名为 `yunli2024.github.io`）。
2. 确认 `posts/` 中的文章已被提交，或使用 `editor.html` 本地生成并上传新的 `.md` 文件。
3. 在仓库设置的 GitHub Pages 中启用 Pages（选择 `main` 分支）。
4. 访问 https://yunli2024.github.io 查看站点。

可选增强：

- 自动发布：使用 GitHub Actions 或 Netlify 构建流程将 Markdown 转换为 HTML 并生成 RSS。
- 直接在浏览器提交：使用 GitHub API（需提供 PAT），可实现从 `editor.html` 直接创建文件并更新 `posts/index.json`。

如果你希望我：

- 帮你提交并推送当前更改（我可以生成 git 命令示例）。
- 增加 GitHub API 直接发布功能（需要你提供 PAT 授权方案）。
- 用静态站点生成器（如 Hugo/Eleventy）把 Markdown 转为更完整的博客模板。

告诉我你想要的下一步，我来继续。
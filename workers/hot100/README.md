# Hot 100 登录与同步

刷题页面位于 `/hot100/`，从主页的 Projects 进入。未连接 Worker 时，题序、收藏和备注保存在当前浏览器。首次登录会把本机的修改合并进个人账号。

## 在 Cloudflare 建库

在 Windows PowerShell 中进入 `D:\homepage\workers\hot100`，运行以下命令。Wrangler 通过 npx 运行，静态网页无需构建。

```powershell
npx.cmd --yes wrangler@4.158.0 login
npx.cmd --yes wrangler@4.158.0 d1 create hot100
Copy-Item -LiteralPath wrangler.toml.example -Destination wrangler.toml
```

把创建结果中的数据库 ID 填入 `wrangler.toml` 的 `database_id`。确认 `SITE_URL` 是正式页面的完整地址，示例已填写 `https://yunli2024.github.io/hot100/`。模板中的 `OWNER_GITHUB_ID` 是公开账号 yunli2024 的数字 ID。Worker 使用这个 ID 限制私人记录的访问。[D1 创建指南](https://developers.cloudflare.com/d1/get-started/)

## 创建 GitHub OAuth App

在 [GitHub Developer settings](https://github.com/settings/developers) 的 **OAuth Apps** 中创建应用。若 Worker 名称沿用 `hot100-sync`，Cloudflare 子域沿用现有博客点赞服务的 `12410922`，对应配置如下。实际地址以 Cloudflare 为准。

| GitHub 设置 | 值 |
| --- | --- |
| Application name | Hot 100 复习手记 |
| Homepage URL | `https://yunli2024.github.io/hot100/` |
| Authorization callback URL | `https://hot100-sync.12410922.workers.dev/auth/callback` |

将 Client ID 填入本地 `wrangler.toml` 的 `GITHUB_CLIENT_ID`，生成的 Client Secret 留到下一步在 Wrangler 提示中输入。登录仅使用公开账号标识。[GitHub OAuth App 指南](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

## 启用同步

```powershell
npx.cmd --yes wrangler@4.158.0 d1 execute hot100 --remote --file schema.sql
npx.cmd --yes wrangler@4.158.0 deploy
npx.cmd --yes wrangler@4.158.0 secret put GITHUB_CLIENT_SECRET
```

在 `hot100/config.mjs` 将 `workerOrigin` 设为上一步部署显示的 Worker 源地址，例如 `https://hot100-sync.12410922.workers.dev`。把静态页面、Projects 入口和这个公开地址一同发布到 GitHub Pages。Client Secret 只保存在 Worker secrets。[Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

电脑登录后收藏一道题、写备注，并在「我的顺序」拖动它。看到「已同步」后，用手机登录同一个 GitHub 账号检查三项记录。离线修改会在联网后重试。跨设备分别修改不同字段会合并，同一条备注的两个版本以服务端最后收到的编辑为准。页面回到前台时立即拉取，停留在前台时每 20 秒检查一次。

## 中文原文

`hot100/catalog.mjs` 保存 100 道题的官方题号、中文标题、链接标识和独立编写的复习提示。官方完整中文题面可以从每题的原题链接阅读。页内阅读器查找 `hot100/statements.zh-CN.json` 中以题号为键的原文 HTML。例如取得适用于本网站的授权题面文件后，把第 1 题的完整 HTML 字符串放在键 `"1"` 下。阅读器保留文字、段落、样例、上下标和 HTTPS 配图。新语言可以增加独立的题面文件，个人记录继续按题号对应。[中文 Hot 100](https://leetcode.cn/studyplan/top-100-liked/) · [力扣服务协议第 3.1.6、5.2 条](https://leetcode.cn/terms/)

## 本地验证

从仓库根目录运行 `python -m http.server 8000`，然后访问 `http://localhost:8000/projects.html`。在 Node.js 24 下运行 `node --test workers/hot100/worker.test.mjs` 可验证账号限制、一次性交接、双设备合并及重复提交。正式 Worker 校验 Pages 来源，本地联调可使用独立的 Worker 配置、D1 本地数据库及匹配的 OAuth 回调。

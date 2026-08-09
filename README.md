# 小羊毛

小羊毛是一个手机优先的优惠入口 PWA，按外卖省钱、到店团购和网购省钱整理常用入口。首页公开展示启用中的入口，`#manage` 管理页使用独立密码维护云端数据。

## 运行方式

- 前端：原生 HTML、CSS、ES Modules JavaScript
- 发布：GitHub `main` 分支自动部署到 Vercel Hobby
- 数据库：Neon Serverless Postgres
- API：Vercel Node.js Functions
- 离线：Service Worker 只缓存本站静态资源，永不缓存 `/api/`

## 本地命令

```bash
npm install
npm run dev          # http://127.0.0.1:4173/，未配置数据库时使用内置只读入口
npm test             # 构建静态输出并运行回归测试
npm run build        # 生成 Vercel outputDirectory=dist
npm run db:migrate   # 执行 Neon 结构迁移
npm run admin:secrets # 本地生成管理密码哈希与会话密钥
npm run db:export    # 从旧站点导出入口（需要 CURRENT_SITE_URL/CURRENT_SITE_COOKIE）
npm run db:import -- data/current-entries.json
```

## Vercel 环境变量

在 Vercel Project Settings → Environment Variables 设置：

- `DATABASE_URL`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`

不要把密码明文、数据库连接串、会话密钥、Cookie 或入口导出文件提交到公开 GitHub 仓库。

## 管理入口

打开首页底部“管理入口”，输入独立管理密码后可以新增、编辑、暂停/恢复入口并标记已确认。启用入口超过 30 天未确认，或从未确认时会显示“待维护”数量。网购分类不会渲染省钱步骤或额外网页备用按钮。

小羊毛仅整理跳转入口，与各平台无隶属或授权关系；优惠内容、领取资格和有效期以目标平台页面为准。

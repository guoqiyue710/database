# InLight 测评后台（Vercel + Supabase）

## 1. 创建 Supabase 项目
1. 新建项目后进入 SQL Editor。
2. 执行下面 SQL 建表：

```sql
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists redeem_codes (
  code text primary key,
  is_active boolean default true,
  max_uses integer default 1,
  used_count integer default 0,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  test_name text not null,
  redeem_code text references redeem_codes(code),
  answers jsonb,
  total_score integer,
  dimension_scores jsonb,
  client_time timestamptz,
  created_at timestamptz default now()
);
```

## 2. 配置 Vercel 环境变量
在 Vercel 项目中设置以下环境变量：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`（例如：`https://inlight.planttree.top,https://cptsd1-inlight.planttree.top`）

## 3. 创建管理员账号（本地一次性执行）

```bash
cd /Users/iris/Desktop/产品计划/数据库
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=your_password
node scripts/create-admin.js
```

## 4. 导入兑换码（本地一次性执行）

```bash
cd /Users/iris/Desktop/产品计划/数据库
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
export CODES_FILE="/Users/iris/Desktop/产品计划/CPTSD/测评产品/兑换码.txt"
export MAX_USES=1
node scripts/seed-redeem-codes.js
```

## 5. 部署到 Vercel
- 新建 Vercel 项目，指向本目录（`/Users/iris/Desktop/产品计划/数据库`）。
- 直接部署即可（静态 + Serverless Functions）。

## 6. 管理后台入口
- 部署后访问：`https://你的-vercel-域名/admin/index.html`


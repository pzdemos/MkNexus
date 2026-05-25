# 编辑器部署与 Nginx 配置

## 今后部署流程

### 1. 环境准备（首次部署）

```bash
# 安装依赖
yum install -y nginx screen

# 配置 SSH 免密登录远程服务器
ssh-keygen -t rsa -b 4096
ssh-copy-id root@121.43.33.235
ssh root@121.43.33.235 "echo 连接成功"
```

### 2. Nginx 配置（首次部署）

编辑 `/etc/nginx/conf.d/opencode.conf`，添加编辑器反向代理：

```nginx
location /editor/ {
    rewrite ^/editor(/.*)$ $1 break;
    proxy_pass http://127.0.0.1:3535;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    proxy_buffering off;
}

location = /editor {
    return 301 /editor/;
}
```

测试并重载：
```bash
/usr/sbin/nginx -t
/usr/sbin/nginx -s reload
```

### 3. 项目准备

```bash
cd /root/MkNexus
npm install
npm run build
```

### 4. 启动服务

```bash
# 方式一：前台运行（调试）
cd /root/MkNexus
npm run start
# Ctrl+C 停止

# 方式二：后台运行（推荐）
cd /root/MkNexus
screen -dmS mknexus bash -c "npm run start"
```

### 5. 管理命令

```bash
# 查看会话
screen -list

# 查看日志
screen -r mknexus
# Ctrl+A D 分离

# 停止服务
screen -X -S mknexus quit
```

### 6. 访问地址

| 服务 | 地址 |
|------|------|
| 编辑器 | http://110.40.142.210/editor |
| 文档站点 | https://docs.haoaiganfan.top |

---

## 修改 Nginx 配置流程

### 步骤 1：编辑配置

```bash
# 主配置
vim /etc/nginx/nginx.conf

# 站点配置
vim /etc/nginx/conf.d/opencode.conf
```

### 步骤 2：测试配置（必须）

```bash
/usr/sbin/nginx -t
```

### 步骤 3：重载配置

```bash
# 方式一：平滑重载（推荐）
/usr/sbin/nginx -s reload

# 方式二：重启（有短暂中断）
systemctl restart nginx
```

### 步骤 4：验证

```bash
# 检查端口
netstat -tlnp | grep -E "80|443"

# 测试访问
curl -s -o /dev/null -w "%{http_code}" http://localhost/editor/
```

### 常见问题排查

| 问题 | 排查命令 |
|------|----------|
| 502 Bad Gateway | `netstat -tlnp \| grep 3535` 检查后端 |
| 配置不生效 | `nginx -t` 检查语法错误 |
| 访问日志 | `tail -f /var/log/nginx/access.log` |
| 错误日志 | `tail -f /var/log/nginx/error.log` |

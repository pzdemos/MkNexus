# Certbot `--expand` 的陷阱：域名被替换而非追加

## 问题现象

执行以下命令后，**证书中原有的所有域名全部丢失**，仅剩下新传入的域名：

```bash
# ❌ 错误用法
certbot certonly --nginx --cert-name example.com \
  -d new-domain.example.com --expand
```

结果证书从：
```
Before: www.example.com, api.example.com, admin.example.com (共 10 个域名)
After:  new-domain.example.com (仅 1 个域名)
```

所有原有子域名的 HTTPS 访问立即中断，浏览器报 `subjectAltName does not match`。

## 根因

`--expand` 的行为不是"追加新域名"，而是**用传入的 `-d` 列表整体替换证书域名**。

> Certbot 文档：`--expand` — Use with `-d` to add a new domain to an existing certificate. **If you use `-d` with multiple domains, they all must be present in the existing certificate.**

关键点：必须一次性传入**所有域名**（旧域名 + 新域名），否则未被传入的域名会被移除。

## 正确用法

```bash
# ✅ 正确：传入所有域名（旧域名 + 新域名）
certbot certonly --nginx --cert-name example.com \
  -d www.example.com \
  -d api.example.com \
  -d admin.example.com \
  -d new-domain.example.com \
  --expand
```

## 验证命令

```bash
# 查看当前证书包含的域名
certbot certificates

# 检查证书的 Subject Alternative Names
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem \
  -noout -text | grep -A 1 "Subject Alternative Name"
```

## 教训

不要相信 `--expand` 的字面语义，它**不是增量追加**，而是**全量替换**。操作前务必备份原有域名列表。

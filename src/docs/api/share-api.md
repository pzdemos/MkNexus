# Share API — 外部调用文档

Base URL: `https://www.haoaiganfan.top/design/oss`

---

## 生成分享链接

```
POST /share
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 文件相对路径 |
| `filename` | string | 是 | 文件名 |
| `password` | string | 否 | 访问密码，不传则无密码 |
| `expiresIn` | number | 否 | 过期时间（小时），默认 `24` |

**Response:**

```json
{
  "success": true,
  "data": {
    "shareId": "a1b2c3d4e5f6a1b2c3d4e5f6",
    "hasPassword": false,
    "shareUrl": "https://www.haoaiganfan.top/design/oss/share/a1b2c3d4e5f6a1b2c3d4e5f6",
    "downloadUrl": "https://www.haoaiganfan.top/design/oss/share/a1b2c3d4e5f6a1b2c3d4e5f6/download",
    "expiresAt": "2026-06-04T15:40:17.928Z",
    "expiresIn": 24
  }
}
```

---

## 获取分享文件信息

```
GET /share/{shareId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "filename": "image.png",
    "size": 135766,
    "isDirectory": false,
    "hasPassword": false,
    "expiresAt": "2026-06-04T15:40:17.928Z",
    "createdAt": "2026-05-28T15:40:17.928Z"
  }
}
```

**错误码:**

| HTTP 状态码 | 说明 |
|-------------|------|
| 404 | 分享链接不存在 |
| 410 | 分享链接已过期 |

---

## 下载文件

```
GET /share/{shareId}/download?verified=true
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `verified` | string | 仅口令分享 | 密码验证通过后传 `true` |

无密码的分享可直接访问。有密码的需先调用验证接口，成功后带上 `?verified=true`。

**Response:** 文件二进制流，`Content-Disposition: attachment`

---

## 在线查看文件

```
GET /share/{shareId}/show?verified=true
```

与下载相同，但返回 `Content-Disposition: inline`，浏览器直接渲染。

**支持预览的类型:**

| 类别 | 格式 |
|------|------|
| 图片 | jpg, jpeg, png, gif, webp, svg, bmp |
| 文档 | pdf |
| 文本/代码 | txt, md, json, js, ts, html, css, xml, csv |
| 视频 | mp4, webm, ogg |
| 音频 | mp3, wav, flac |

Office 文件（doc/docx/xls/xlsx/ppt/pptx）请使用 Google Docs Viewer:

```
https://docs.google.com/viewer?url={encodedShowUrl}
```

---

## 验证分享密码

```
POST /share/{shareId}/verify
Content-Type: application/json
```

**Request Body:**

```json
{
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

**错误码:**

| HTTP 状态码 | 说明 |
|-------------|------|
| 403 | 密码错误 |
| 404 | 分享链接不存在 |

---

## 获取分享列表（需登录）

```
GET /share/list
Authorization: Bearer <token>
```

返回当前用户的所有有效分享。

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "shareId": "a1b2c3d4e5f6a1b2c3d4e5f6",
      "filename": "image.png",
      "filePath": "tmp/image.png",
      "hasPassword": false,
      "createdAt": "2026-05-28T15:40:17.928Z",
      "expiresAt": "2026-06-04T15:40:17.928Z",
      "accessCount": 0,
      "isExpired": false
    }
  ]
}
```

---

## 删除分享（需登录）

```
DELETE /share/{shareId}
Authorization: Bearer <token>
```

只能删除自己的分享。

**Response:**

```json
{
  "success": true,
  "message": "分享链接已删除"
}
```

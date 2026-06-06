# Image Color Analyze API

这是一个部署到 Vercel 的轻量图片色彩解析 API。

## 接口

- `GET /api/analyze`：健康检查
- `POST /api/analyze`：解析图片颜色

## 请求示例

```json
{
  "files": [
    {
      "base64": "data:image/png;base64,..."
    }
  ]
}
```

也可以直接传：

```json
{
  "base64": "data:image/png;base64,..."
}
```

## 返回示例

```json
{
  "json_data": "[{\"hex\":\"#A8B8C8\",\"count\":1200,\"percentage\":36.5}]",
  "color_types": 1,
  "status": "解析成功"
}
```

## 本地调试

安装 Vercel CLI 后运行：

```bash
vercel dev
```

然后访问：

```text
http://localhost:3000/api/analyze
```

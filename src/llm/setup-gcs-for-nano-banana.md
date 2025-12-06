---
title: '让 Nano-Banana 生图不再"吃内存"：GCS 集成攻略'
date: 2025-08-31
category:
  - 开发
tag:
  - Google Cloud
  - GCS
  - VertexAI
  - Gemini
  - Nano-Banana
star: true
excerpt: 为 Nano‑Banana 集成 GCS，提供高效稳定的大图输入方案与生产级配置清单（CORS、生命周期、目录规范等）。
cover: /covers/setup-gcs-for-nano-banana.jpg
---

## 为什么要折腾 GCS？

当你兴致勃勃地调用 Gemini/VertexAI 生图 API 时，突然发现一个残酷的现实：这货只支持两种图片输入方式。

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Base64 编码** | 简单直接，无需额外配置 | 请求体巨大，传输慢，容易超时 | 小图片（<1MB）快速测试 |
| **GCS 图片链接** | 请求体小，传输快，支持大图 | 需要配置 GCS，有学习成本 | 生产环境，大图片处理 |

显然，除非你喜欢看到接口请求大到能当小说读，否则 GCS 就是你的救星。本文就是教你如何优雅地驯服这只"云存储小兽"。

## 开始前的"装备检查"

在开始这场与 GCS 的"亲密接触"之前，请确保你已经：

- 🛠️ 安装并配置了 `gcloud` CLI（如果还没装，那就先去喝杯咖啡，回来再说）
- 🔑 拥有 Google Cloud 项目和服务账户（没有的话，Google 不会让你进门的）
- 📋 准备好你的项目信息：`{YOUR_GCP_PROJECT_ID}` 和 `{YOUR_SERVICE_ACCOUNT_EMAIL}`

> **温馨提示：** 文档中的占位符 `{...}` 需要替换成你的真实信息，不然命令会"装糊涂"哦！

## 正式开始"调教"GCS

### 第一步：确认你的"身份证"

首先，让我们确认一下 gcloud 是否认识你这个"老朋友"：

```bash
# 查看当前配置
gcloud config list

# 查看认证状态  
gcloud auth list

# 切换到目标项目
gcloud config set project {YOUR_GCP_PROJECT_ID}
```

### 第二步：给你的图片找个"豪宅"

现在我们要创建一个存储桶（Bucket），想象它是一个超大的云端硬盘，专门用来放你的图片：

```bash
# 创建存储桶（选择美国中部，延迟低，还便宜）
gsutil mb -p {YOUR_GCP_PROJECT_ID} -c STANDARD -l us-central1 gs://{YOUR_BUCKET_NAME}

# 设置公开只读权限（让全世界都能看到你的图片杰作）
gsutil iam ch allUsers:objectViewer gs://{YOUR_BUCKET_NAME}
```

> **小贴士：** 为什么选 `us-central1`？因为它是 Google 的"老家"，速度快，价格美丽，生图 API 也住在这附近呢！

### 第三步：设计你的"图片豪宅"布局

我们不能让图片们像无头苍蝇一样乱放，得给它们安排个"豪华别墅式"的目录结构。采用 **日期 + 毫秒时间戳** 的组合，既能按时间归档，又能避免重名冲突（除非你能在同一毫秒内生成两张图，那就太厉害了）：

```text
gs://{YOUR_BUCKET_NAME}/
└── {PROJECT_PREFIX}/                      # 项目前缀
    ├── 20250831/                         # 日期目录
    │   ├── 1756636726921/               # 毫秒时间戳 session-id
    │   │   ├── input/                   # 输入文件
    │   │   ├── output/                  # 输出文件
    │   │   └── logs/                    # 日志文件
    │   └── 1756636845678/               # 另一个 session
    └── 20250901/                        # 下一天的目录
        └── 1756723200000/
```

### 第四步：开通"跨域通行证"（CORS 配置）

想要让你的网站直接跟 GCS "对话"？那必须先办个"跨域通行证"！不然浏览器会把你的请求当作"可疑分子"拦下来。

创建一个 CORS 配置文件（就像给 GCS 写一份"信任名单"）：

```json
// docs/cors-config.json
[
  {
    "origin": ["http://localhost:3000", "https://localhost:3000", "https://{YOUR_DOMAIN}"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

然后把这份"信任名单"交给 GCS：

```bash
# 应用 CORS 配置（让 GCS 知道谁是"自己人"）
gsutil cors set docs/cors-config.json gs://{YOUR_BUCKET_NAME}

# 验证配置（确认 GCS 记住了你的要求）
gsutil cors get gs://{YOUR_BUCKET_NAME}
```

> **解释一下 `maxAgeSeconds: 3600`：** 这是告诉浏览器"这个通行证有效期1小时"，避免每次请求都要重新验证身份，就像办了年卡的健身房，刷卡进门更顺畅。

### 第五步：雇个"自动清洁工"（生命周期管理）

生图这玩意儿，用完就扔是常事。但手动删文件？太LOW了！我们要让 GCS 自己当"清洁工"，3天后自动把临时图片清理掉，避免存储费用像失控的小怪兽一样疯长。

创建一个"自动清理合同"：

```json
// docs/lifecycle-config.json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 3,
          "matchesPrefix": ["{PROJECT_PREFIX}/"]
        }
      }
    ]
  }
}
```

然后让 GCS 签下这份"清洁合同"：

```bash
# 应用生命周期规则（雇佣自动清洁工）
gsutil lifecycle set docs/lifecycle-config.json gs://{YOUR_BUCKET_NAME}

# 验证配置（确认清洁工已上岗）
gsutil lifecycle get gs://{YOUR_BUCKET_NAME}
```

> **为什么是3天？** 因为大部分生图任务在几分钟内就完成了，3天足够你把结果下载保存，之后继续占着空间就是浪费钱了！

### 第六步：试车！（测试上传功能）

配置完了，该试试这套"豪华配置"能不能正常工作了：

```bash
# 创建一个测试文件并上传（就像试驾新车一样）
SESSION_ID=$(node -e "console.log(Date.now())")
gsutil cp local-file.jpg gs://{YOUR_BUCKET_NAME}/{PROJECT_PREFIX}/$(date +%Y%m%d)/$SESSION_ID/

# 测试公开访问（确认图片能被全世界看到）
curl -I https://storage.googleapis.com/{YOUR_BUCKET_NAME}/{PROJECT_PREFIX}/$(date +%Y%m%d)/$SESSION_ID/file-name.jpg
```

如果看到 `200 OK`，恭喜你！GCS 已经被你成功"驯服"了！

## 🎉 配置清单（检查一下是否都搞定了）

| 配置项 | 值 | 状态 |
|--------|-----|------|
| 项目 | {YOUR_GCP_PROJECT_ID} | ✅ |
| 存储桶 | {YOUR_BUCKET_NAME} | ✅ |
| 区域 | us-central1 | ✅ 就近原则 |
| 访问权限 | 公开只读 | ✅ 全世界可见 |
| CORS 缓存 | 1小时 | ✅ 减少延迟 |
| 自动删除 | {PROJECT_PREFIX}/ 目录 3天后 | ✅ 省钱神器 |

## 🔗 你的图片"门牌号"格式

配置完成后，你的每张图片都会有一个独特的"门牌号"（URL）：

**标准格式：**

```text
https://storage.googleapis.com/{YOUR_BUCKET_NAME}/{PROJECT_PREFIX}/{yyyyMMdd}/{timestamp}/文件名
```

**实际长这样：**

```text
https://storage.googleapis.com/example-app-storage/myapp/20250831/1756636726921/ai-generated-cat.jpg
```

这个 URL 就可以直接丢给 Gemini API 了，再也不用担心 Base64 把你的请求撑爆！

## 🚀 实战：在 Gemini API 中使用 GCS 图片

配置好 GCS 后，真正的魔法开始了！让我们看看如何在调用 Gemini/VertexAI 时优雅地传递 GCS 图片。

### 实战开始

### Node.js SDK 调用示例

```javascript
// 使用 GCS 图片的标准格式
const imageInput = {
  fileData: {
    fileUri: "gs://{YOUR_BUCKET_NAME}/{PROJECT_PREFIX}/20250831/1756636726921/input.jpg",
    mimeType: "image/jpeg"
  }
};

const contents = [{
  role: 'user', 
  parts: [
    { text: "请分析这张图片并生成一张类似风格的新图片" },
    imageInput
  ]
}];

const response = await vertexAI.generateContent(contents);
```

### cURL 调用示例

```bash
# 使用 GCS 图片调用 VertexAI API
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/{YOUR_GCP_PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-2.5-flash-image-preview:generateContent" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {"text": "请分析这张图片"},
        {
          "fileData": {
            "fileUri": "gs://{YOUR_BUCKET_NAME}/{PROJECT_PREFIX}/20250831/1756636726921/input.jpg",
            "mimeType": "image/jpeg"
          }
        }
      ]
    }]
  }'
```

### 关键要点

- **fileUri 格式**：必须是 `gs://` 开头的完整 GCS 路径
- **mimeType 必填**：告诉 Gemini 这是什么类型的图片
- **权限要求**：确保服务账户对 GCS 存储桶有读取权限

> **Pro Tip：** 使用 GCS 链接时，图片会被自动压缩到最大 3072x3072 分辨率，既保证质量又控制处理时间！

## 📝 占位符"翻译手册"

看到文档中的 `{...}` 了吗？这些都是需要你"填空"的地方：

| 占位符 | 含义 | 参考示例 |
|--------|------|----------|
| `{YOUR_GCP_PROJECT_ID}` | 你的 GCP 项目 ID | `my-ai-project-2025` |
| `{YOUR_SERVICE_ACCOUNT_EMAIL}` | 服务账户邮箱 | `ai-bot@my-project.iam.gserviceaccount.com` |
| `{YOUR_BUCKET_NAME}` | 存储桶名称 | `my-nanobana-images` |
| `{YOUR_DOMAIN}` | 你的网站域名 | `myapp.vercel.app` |
| `{PROJECT_PREFIX}` | 项目文件夹名 | `nb` |

> **记住：** 这些只是示例，请替换成你自己的真实信息！不然 GCS 会一脸懵逼地看着你。

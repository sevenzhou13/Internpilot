# InternPilot API 变更记录

最后更新：2026-07-10

## 基础

- `GET /health`：返回服务状态和运行模式。

## 岗位导入

- `POST /api/jobs/import/text/preview`：传入 `{ "text": "..." }`，返回一个或多个规则结构化岗位预览。
- `POST /api/jobs/import/file/preview`：上传 TXT、PDF 或 DOCX，最大 5 MB，返回结构化预览。
- `POST /api/jobs/import/url/preview`：传入公开 HTTP/HTTPS URL，限制 10 秒、2 MB、最多 4 次跳转，并阻止内网地址。
- `POST /api/jobs/import/commit`：传入预览岗位列表，默认跳过重复岗位并分别返回 `created`、`duplicates`。

## 岗位分析

- `GET /api/jobs/{job_id}/analysis`：返回岗位主记录、标准化技能、投递事件和模型预测历史。
- `GET /api/jobs/{job_id}/match-explanation`：返回规则匹配总分、技能/经历/要求/地点分项、已匹配技能和待补足技能；需要已设置偏好和至少一条经历。
- `POST /api/jobs/{job_id}/parse`：LLM 解析后再次运行规则结构化，写回标准字段并同步技能表。

## 岗位分类训练

- `GET /api/jobs/categories/review`：返回待复核岗位和可选大类；人工标签优先于规则标签。
- `POST /api/jobs/{job_id}/category-label`：传入 `{ "category": "数据分析/BI", "reviewer_note": "" }` 保存人工复核。
- `POST /api/models/job-category/train`：训练并保存 `TF-IDF + Logistic Regression` 模型，默认仅使用人工标签；可传入 `{ "include_weak_labels": true }` 混入规则弱标签。
- `POST /api/jobs/{job_id}/predict-category`：使用已训练模型预测岗位大类，保存一条模型预测历史；不会覆盖人工复核结果。

## 本地知识检索

- `POST /api/knowledge/rebuild`：将岗位、个人经历和简历切片写入本地知识索引。
- `GET /api/knowledge/search?query=...&job_id=...`：按问题检索相关本地资料；当前使用可复现的 TF-IDF 基线。

前端岗位详情页提供单条人工复核和模型预测入口；批量标注与训练命令见 `docs/training/JOB_CATEGORY_TRAINING.md`。

URL 安全例外：仅 `join.qq.com` 在本地网络被映射到 `198.18.0.0/15` 测试代理段时可继续导入；该例外不适用于其他域名、本机或内网地址。

限制：服务端 URL 导入只解析直接返回的 HTML/纯文本。依赖浏览器 JavaScript 渲染的招聘页（包括当前腾讯招聘链接）应使用 Clipper 或手动粘贴 JD。

## 兼容行为

- 原 `POST /api/jobs` 仍可使用，但会自动结构化并对重复岗位返回 HTTP 409。
- 原 `PATCH /api/jobs/{id}/status` 仍更新当前状态，同时新增投递事件。
- 原 `PATCH /api/jobs/{id}` 只覆盖请求实际提供的字段，其余结构化字段会保留并重新计算。

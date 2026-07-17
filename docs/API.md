# InternPilot API 变更记录

最后更新：2026-07-11

## 基础

- `GET /health`：返回服务状态和运行模式。

## 岗位导入

- `POST /api/jobs/import/text/preview`：传入 `{ "text": "..." }`，返回一个或多个规则结构化岗位预览。
- `POST /api/jobs/import/file/preview`：上传 TXT、PDF 或 DOCX，最大 5 MB，返回结构化预览。
- `POST /api/jobs/import/url/preview`：传入公开 HTTP/HTTPS URL，限制 10 秒、2 MB、最多 4 次跳转，并阻止内网地址。
- `POST /api/jobs/import/browser/start`：传入公开 HTTP/HTTPS URL，返回 `202` 和 `task_id`；本地模式会启动专用可见 Chrome，Demo 模式禁用。
- `GET /api/jobs/import/browser/{task_id}`：轮询 `queued/opening/waiting/extracting/done/error/cancelled` 状态；完成时返回结构化岗位预览。
- `POST /api/jobs/import/browser/{task_id}/cancel`：取消仍在运行的浏览器解析任务。
- `POST /api/jobs/import/commit`：传入预览岗位列表，默认跳过重复岗位并分别返回 `created`、`duplicates`。

## 岗位分析

- `GET /api/jobs/{job_id}/analysis`：返回岗位主记录、标准化技能、投递事件和模型预测历史。
- `GET /api/jobs/{job_id}/match-explanation`：返回规则匹配总分、技能/经历/要求/地点分项、已匹配技能和待补足技能；需要已设置偏好和至少一条经历。
- `POST /api/jobs/{job_id}/match`：显式重算当前岗位的个人经历匹配，写回总分并返回四项可解释证据。
- `POST /api/jobs/{job_id}/parse`：LLM 解析后再次运行规则结构化，写回标准字段并同步技能表。

## AI 岗位类别与兼容训练实验

- `POST /api/jobs/{job_id}/parse`：LLM 解析时返回开放的 `job_category`、`category_reason` 和可选 `taxonomy_note`；类别不受八类示例限制。
- `GET /api/jobs/categories/review`：返回已使用类别和八类示例，`category_mode` 为 `open_taxonomy`。
- `POST /api/jobs/{job_id}/category-label`：传入任意非空、最多 60 字的 `{ "category": "量化研究/金融工程", "reviewer_note": "" }` 保存人工确认。
- `GET /api/taxonomy`：返回当前岗位类别频数和最近的合并历史。
- `POST /api/taxonomy/merge`：传入 `{ "source_category": "商业数据分析", "target_category": "数据分析", "reason": "合并近义类别" }`。这是用户确认操作：逐岗位写入历史后合并，不允许 AI 静默批量执行。
- `POST /api/models/job-category/train`、`POST /api/jobs/{job_id}/predict-category`：保留为旧的 TF-IDF 分类实验接口，不是产品主流程。

## 本地知识检索

- `POST /api/knowledge/rebuild`：将岗位、个人经历和简历切片写入本地知识索引。
- `GET /api/knowledge/search?query=...&job_id=...`：按问题检索相关本地资料；当前使用可复现的 TF-IDF 基线。

## 岗位分析

- `GET /api/analytics/overview`：返回岗位类别/来源分布、投递状态漏斗、高频技能和个人技能短板。
- `GET /api/resumes/match-scores?job_id=...`：返回每份已上传 HTML/PDF 简历与指定岗位的匹配分。

`APP_MODE=demo` 时 `/health` 返回 `mode=demo`；应用自动使用匿名种子数据且所有外部 LLM 接口保持未配置状态。

前端岗位详情页提供 AI 重新分类、人工确认和自定义类别输入；批量标注及训练脚本只用于兼容实验。开放 taxonomy 的新增、合并或拆分建议会保留在 AI 解析结果中，正式调整前应由用户确认。

URL 安全校验：浏览器辅助导入校验初始地址及跳转地址；本机、内网、保留 IP 和本地域名均拒绝访问。代理的 `198.18.0.0/15` Fake-IP 仅作为浏览器代理映射接受，不能使用字面 IP 访问。

前端粘贴链接默认使用浏览器辅助导入；旧 `POST /api/jobs/import/url/preview` 保留为兼容接口，仅解析直接返回的 HTML/纯文本。

## 兼容行为

- 原 `POST /api/jobs` 仍可使用，但会自动结构化并对重复岗位返回 HTTP 409。
- 原 `PATCH /api/jobs/{id}/status` 仍更新当前状态，同时新增投递事件。
- 原 `PATCH /api/jobs/{id}` 只覆盖请求实际提供的字段，其余结构化字段会保留并重新计算。

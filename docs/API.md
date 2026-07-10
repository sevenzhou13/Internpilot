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
- `POST /api/jobs/{job_id}/parse`：LLM 解析后再次运行规则结构化，写回标准字段并同步技能表。

## 兼容行为

- 原 `POST /api/jobs` 仍可使用，但会自动结构化并对重复岗位返回 HTTP 409。
- 原 `PATCH /api/jobs/{id}/status` 仍更新当前状态，同时新增投递事件。
- 原 `PATCH /api/jobs/{id}` 只覆盖请求实际提供的字段，其余结构化字段会保留并重新计算。

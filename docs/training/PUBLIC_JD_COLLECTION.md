# 公开 JD 课程数据采集规范

最后更新：2026-07-11

## 目标

为岗位类别分类课程实验积累约 300 条可人工复核的公开 JD。建议八个类别尽量均衡，每类至少 20 条；剩余样本可分配给常见类别。

## 合规与数据边界

- 仅在项目所有者明确授权时，读取无需绕过限制即可访问的公开岗位信息。
- 不绕过或规避登录、验证码、Cookie、访问控制或反爬机制；出现验证页、限流或拒绝访问时立即停止该来源。
- 不触发“立即沟通”、收藏、投递或其他会影响账号、招聘方或第三方的操作。
- 不记录招聘人员姓名、联系方式、Cookie、登录态或候选人信息。真实原始数据仅保存在 Git 忽略的 `data/raw/`。

## 采集与审计格式

每条 JSONL 记录至少包含：`source_url`、`captured_at`、`query`、`platform`、`title`、`company`、`location`、`jd_text`。`captured_at` 使用 ISO 8601 时间；`query` 记录检索词，方便复现样本构成。

建议按小批次采集：每次检索只读取页面已公开展示的岗位，完成一批后检查重复、内容质量和类别覆盖度，再继续下一批。不要把同一岗位的多个变体重复计入训练集。

## 导入与人工复核

1. 将本地 JSONL 放入 `data/raw/`，例如 `data/raw/boss_public_jds_20260711.jsonl`。
2. 使用 `scripts/import_public_jds.py` 导入，脚本会结构化、去重并保留岗位 URL。
3. 导出复核表，填写人工类别：

```powershell
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py export --output data\processed\job_category_review.csv
```

4. 导入标签后，执行仅人工标签训练：

```powershell
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py import --input data\processed\job_category_review.csv
.\.venv\Scripts\python.exe scripts\train_job_category.py --manual-only
```

训练报告必须写明样本来源、采集日期范围、人工复核数量、类别分布、固定随机种子和 Macro-F1；不得将规则弱标签指标表述为人工标注效果。

## 带原生类别的外部训练数据

正式训练优先使用同时提供岗位名称、JD 和原始岗位类别的中文数据。当前筛选到的候选是[应届生招聘数据集（2014–2024）](https://textdata.cn/blog/2025-03-06-chinese-fresh-graduates-recruitment-dataset/)：发布页说明其含 `job`、`desc`、`category` 字段，并声明科研用途。文件须由项目所有者依发布方渠道取得，再放到 Git 忽略的 `data/raw/`；不得自行从原招聘平台批量补抓。

取得文件后的固定步骤：先对原始 `category` 做频数和空值检查，保存数据集版本、许可和字段定义；随后建立并评审“原始类别 → 项目八类”映射表；最后把已映射记录作为 `external_dataset` 标签导入。复合类、无法判断的类别和映射后样本过少的类别必须排除或单列，不能静默猜测。

## 仅用于导入/检索测试的无类别候选

[Job Educational Parser Dataset](https://huggingface.co/datasets/wangzihaogithub/job-educational-parser-dataset-08-0-0805) 是 Apache-2.0 的中文岗位描述集，提供学历要求而非岗位类别。它只可用于导入、检索和人工复核界面的测试，不能作为类别训练真值，也不能由 LLM 映射后变成 `external_dataset`。

下列命令通过 Hugging Face 的公开数据接口抽取 300 条到 Git 忽略的本地目录；不下载整个数据集：

```powershell
.\.venv\Scripts\python.exe scripts\download_hf_public_jds.py --count 300
.\.venv\Scripts\python.exe scripts\import_public_jds.py --input data\raw\hf_job_education_300.jsonl
```

抽取记录会标记数据集名称、原始 `job_id`、抽取时间与 Apache-2.0 来源页。该数据集只标注学历而不标注岗位类别，导入后仍按本指南的人工复核步骤填写八个类别。

如需一次性为这 300 条生成待复核建议，可运行：

```powershell
.\.venv\Scripts\python.exe scripts\bootstrap_job_category_suggestions.py
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py export --output data\processed\job_category_review.csv --limit 500
```

该脚本只用已有规则弱标签训练临时模型，写入的 `suggested_category`、`suggestion_confidence` 和 `suggestion_source` 仅用于排序复核，绝不能直接导入为人工或外部真值标签。

规则或 LLM 建议只用于排序或探索性弱监督；用户已决定不将这批无类别候选用于正式训练或课程指标。

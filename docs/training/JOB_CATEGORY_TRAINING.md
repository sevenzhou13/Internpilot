# 岗位类别标注、训练与评估指南

## 目标与边界

这是保留的兼容实验：根据岗位标题、标准技能和 JD 文本预测岗位大类。它不预测投递成功率，也不使用个人简历或投递结果作为特征；产品主流程已改为 AI 驱动的开放 taxonomy。

下列八类仅是该**历史实验**的示例标签集合。开放 taxonomy 的产品类别不受此列表限制：

```text
算法/机器学习
数据分析/BI
用户研究
产品/AI产品
后端开发
前端/客户端
市场/运营
销售/咨询/项目管理
```

## 准备数据

先在应用中导入匿名或公开岗位，再导出待复核清单：

```powershell
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py export --output data\processed\job_category_review.csv
```

CSV 包含规则建议的 `rule_category` 和 `category_confidence`，可帮助复核，但不能直接视为真值。请填写：

- `category`：上方的精确类别名称；
- `reviewer_note`：模糊、复合岗位或改判原因。

导入人工标签：

```powershell
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py import --input data\processed\job_category_review.csv
```

### 使用带类别字段的外部数据集

如果外部数据集的 `category` 已经有明确来源，且能先映射到本项目规定的八类，可直接作为 `external_dataset` 标签训练，不必逐条人工复核。映射表、数据集版本、许可和字段定义必须保存到实验记录；类别名称不一致、复合类或不明类不能直接导入。

仅有岗位标题或 JD、但没有原始岗位类别的数据，不得通过规则或 LLM 推断后作为本节的 `external_dataset` 真值。此类推断最多用于候选排序或探索性弱监督实验，不能用于正式课程训练或指标。

建议每个映射后的类别至少抽查 10%（且不少于 5 条），这不是为了重新人工标注整套数据，而是确认外部类别口径没有映射错误。导入映射后的 CSV 时使用：

```powershell
.\.venv\Scripts\python.exe scripts\manage_job_category_labels.py import --input data\processed\job_category_review.csv --label-source external_dataset
```

训练输出会单独记录 `external_dataset_sample_count`；外部标签的指标必须表述为“外部数据集标签评估”，不能写成“人工复核效果”。

真实岗位 CSV 和数据库属于个人数据，位于 `data/`，已被 Git 忽略；公开仓库只能提交脱敏样例和聚合结果。

## 训练

仅使用已复核或已完成口径映射的外部标签是课程报告的默认方式。`--manual-only` 排除外部类别；不加参数则合并人工标签与 `external_dataset` 标签：

```powershell
.\.venv\Scripts\python.exe scripts\train_job_category.py --manual-only

# 原生外部类别映射实验（可同时含人工标签）
.\.venv\Scripts\python.exe scripts\train_job_category.py
```

探索性训练可以混入规则弱标签，但结果必须清楚标为“含弱监督标签”：

```powershell
.\.venv\Scripts\python.exe scripts\train_job_category.py --include-weak-labels
```

训练模型写入 `artifacts/models/`（Git 忽略）。输出中的 `sample_count`、`class_distribution`、`metrics` 和标签来源必须记录在实验报告中。

## 指标解释

- 总标签少于 8 条或任一类别少于 2 条：模型可以训练用于连通性验证，但没有独立评估指标，不能宣称模型效果。
- 满足上述条件：固定 `random_state=42` 的分层留出集会输出 Accuracy、Macro-F1 和每类报告。
- 建议课程报告至少每类 20 条人工标签；约 300 条人工标签后再比较传统基线与增强模型。
- 若某类别 F1 低，检查其标题/JD 是否与相邻类别重叠、标签是否一致、类别是否极不平衡；不要仅通过删除失败样本提高指标。

## API 方式

启动服务后也可调用：

- `GET /api/jobs/categories/review`
- `POST /api/jobs/{job_id}/category-label`
- `POST /api/models/job-category/train`
- `POST /api/jobs/{job_id}/predict-category`

API 合约见 `docs/API.md`。

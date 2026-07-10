# 岗位类别标注、训练与评估指南

## 目标与边界

这是课程项目的第一个可复现模型：根据岗位标题、标准技能和 JD 文本预测岗位大类。它不预测投递成功率，也不使用个人简历或投递结果作为特征。

当前类别必须精确填写为以下之一：

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

真实岗位 CSV 和数据库属于个人数据，位于 `data/`，已被 Git 忽略；公开仓库只能提交脱敏样例和聚合结果。

## 训练

仅使用人工复核数据是课程报告的默认方式：

```powershell
.\.venv\Scripts\python.exe scripts\train_job_category.py --manual-only
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

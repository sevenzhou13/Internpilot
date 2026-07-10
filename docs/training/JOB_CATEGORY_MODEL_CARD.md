# 岗位类别分类基线模型卡

## 标识

- 模型名称：`job-category-tfidf-logreg`
- 当前版本：`v1`
- 任务：由岗位标题、标准技能和 JD 文本预测岗位大类。
- 实现：`modules/job_classifier.py`
- 训练入口：`scripts/train_job_category.py`

## 数据与标签

- 样本来源：用户手动导入、文件导入、公开 URL 或 Clipper 保存的岗位；公开演示只能使用匿名数据。
- 特征：`title + skills + jd_text`；不使用个人经历、简历、投递反馈或敏感字段。
- 真值标签：`job_category_labels` 表内的人工复核类别。
- 弱标签：规则结构化得到的 `jobs.job_category`；只可用于探索性训练，报告必须单独说明。

## 训练与评估

- 向量化：词级 1–2 gram TF-IDF，`sublinear_tf=True`。
- 分类器：`LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)`。
- 切分：满足总样本至少 8 条、每类至少 2 条时，使用固定种子 42 的分层留出集；测试集至少覆盖每一个类别。
- 指标：Accuracy、Macro-F1 和每类分类报告。样本不足时，输出 `evaluated: false`，不得将训练连通性验证表述为模型效果。

## 当前状态与限制

- 代码和最小样本端到端测试已通过，但尚未使用足量人工标注数据训练真实项目模型。
- 该基线主要作为可解释、可复现的课程参照；中文预训练向量 + 轻量 MLP 是后续对照实验，不是当前模型的替代声明。
- 模型产物保存在 `artifacts/models/`，不提交到 Git；实验记录需保存样本数、类别分布、标签模式、版本和全部指标。

## 风险与缓解

- 类别不平衡：保留类别分布，使用 `class_weight="balanced"`，报告 Macro-F1。
- 规则污染：课程主报告默认仅使用人工标签；弱标签实验单独标明。
- 复合岗位：在 `reviewer_note` 中记录判断依据，必要时由项目所有者统一复核类别边界。
- 数据泄漏：同一岗位的重复链接和近似文本需先通过导入去重，再进入训练集。

# 当前交接

最后更新：2026-07-11

## 已验证基线

- 分支：`main`，本地工作区包含尚未提交的第 4–5 周前端呈现、岗位分析与聚类改动。
- 数据库：迁移版本 4；包含结构化岗位、技能、投递事件、模型预测、人工类别标签和 taxonomy 合并历史。
- 岗位类别：LLM 解析可写入开放类别、分类依据和 taxonomy 优化建议；八类仅作规则兜底和输入示例。详情页可人工确认或输入新类别；旧 TF-IDF 分类接口仅保留为兼容实验，不能覆盖 AI 或人工结果。
- RAG：岗位、经历和简历可建立本地 TF-IDF 知识索引，检索片段会注入 AI 助手上下文。
- 匹配：岗位卡片有“匹配详情”入口；详情页可显式计算个人经历匹配、查看技能/经历/要求/地点四项证据，并显示所有已上传简历与当前岗位的匹配分。
- 前端：AI 助手显示本轮检索来源。
- 分析：控制台显示岗位类别、投递漏斗、高频技能和技能短板。
- 聚类：使用 TF-IDF + K-Means 输出需求簇关键词、代表岗位和可用时的 silhouette 指标。
- Demo：`APP_MODE=demo` 使用独立匿名种子数据库、禁用外部 LLM，并可用 `render.yaml` 部署；`scripts/security_check.py` 验证敏感数据没有被 Git 跟踪。Demo `/health` 和实验导出已实际验证。
- 课程交付：`scripts/run_mining_experiment.py` 在 Git 忽略目录导出聚合实验报告；K-Means 自动比较候选簇数，固定种子为 42。
- 验证：`compileall`、`git diff --check`、安全检查通过；pytest 37 项通过（12 条第三方依赖弃用警告）。岗位详情 JSX 仍需在项目所有者本机浏览器手工复测。

## 当前优先级

1. 在本机浏览器手工验收匿名 Demo 与详情页 taxonomy 合并界面。
2. 由项目所有者在 Render 账户中授权仓库并创建 Demo 服务；按 `docs/DEPLOYMENT.md` 验收。
3. 可选后续增强：中文向量检索与混合语义匹配。

## 下一步操作

1. 按 `docs/DEMO.md` 启动 `APP_MODE=demo`，检查匿名种子、聚类卡片和 taxonomy 合并。
2. 运行 `scripts/run_mining_experiment.py --max-clusters 5` 并使用生成的 Markdown 准备报告。
3. 运行 `scripts/security_check.py`；如需公网 Demo，再由用户完成 Render 授权与创建服务。

详见 `docs/training/JOB_CATEGORY_TRAINING.md`。

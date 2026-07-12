# 文档索引与权威性

本目录是当前项目文档的唯一入口。每次变更必须先判断下列哪份文档受影响并同步更新。

| 文档 | 用途 | 更新时机 |
|---|---|---|
| `REQUIREMENTS.md` | 已确认目标、范围和验收标准 | 需求或优先级变化 |
| `ARCHITECTURE.md` | 当前实现架构与数据流 | 服务、存储、模型或主要集成变化 |
| `API.md` | 对外 API 合约 | 新增/修改接口 |
| `DATA_DICTIONARY.md` | 持久化数据含义 | 迁移或字段变化 |
| `DECISIONS.md` | 长期技术取舍（ADR） | 有替代方案的关键决策 |
| `PROJECT_PROGRESS.md` | 已完成工作和验证证据 | 一个任务/里程碑完成 |
| `TEST_REPORT.md` | 可复现验证记录 | 测试范围或结果变化 |
| `context/PROJECT_MEMORY.md` | 有界长期记忆与协作规则 | 事实、文档路由或工作方式变化 |
| `context/HANDOFF.md` | 当前状态与下一步 | 每次交接或任务完成 |
| `training/` | 标签、训练、评估操作手册 | 训练流程或数据契约变化 |
| `DEMO.md` | 匿名演示的运行边界和步骤 | Demo 行为变化 |
| `DEPLOYMENT.md` | 云端配置与安全验收 | 部署或安全流程变化 |
| `COURSE_DELIVERY.md` | 课程实验、答辩和提交材料 | 课程交付变化 |

`archive/` 存放被替代的 Streamlit 方案和重组前文档，只可用于历史追溯；不可作为当前代码或设计的依据。

当前训练操作入口：`training/JOB_CATEGORY_TRAINING.md`；用户授权公开数据的采集与 JSONL 契约：`training/PUBLIC_JD_COLLECTION.md`。

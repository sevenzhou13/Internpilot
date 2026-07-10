# Phase 3 · InternPilot Clipper 浏览器插件

> 预计用时：Day 6 上午（约 3-4 小时）
> 前置条件：P0 + P1 完成；岗位推荐页面已支持粘贴 JSON 导入
> 目标：Chrome 插件能剪藏当前页面 → 复制 JSON → 粘贴到 Web App 导入
> 状态：⬜ 未开始

---

## 任务清单

### 6.1 创建目录结构

- [ ] 创建 `extension/` 目录
- [ ] 创建 `extension/icons/` 目录（需要 icon16.png / icon48.png / icon128.png）

```
extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

> 图标可以先用任意简单图标（纯色方块即可），不影响功能测试

---

### 6.2 实现 `manifest.json`

- [ ] Manifest Version: 3
- [ ] 权限：`["activeTab", "scripting", "clipboardWrite", "tabs"]`
- [ ] 注册 `popup.html` 为 action popup

```json
{
  "manifest_version": 3,
  "name": "InternPilot Clipper",
  "version": "0.1.0",
  "description": "Clip internship job postings into InternPilot.",
  "permissions": ["activeTab", "scripting", "clipboardWrite", "tabs"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "InternPilot Clipper"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

### 6.3 实现 `popup.html`

- [ ] 展示：页面标题 / 当前 URL / 来源域名 / 检测到的文本长度
- [ ] 文本预览区域（前 200 字符）
- [ ] 主按钮：「复制为岗位 JSON」
- [ ] 次按钮：「打开 InternPilot」（打开 `http://localhost:8501`）
- [ ] 状态提示区域（成功 / 失败 / 无文本）
- [ ] popup 宽度：360px

---

### 6.4 实现 `popup.js`

核心逻辑：

- [ ] `collectPageData()`：通过 `chrome.scripting.executeScript` 注入到当前 tab 执行
  - 获取 `document.title`
  - 获取 `window.location.href`
  - 获取 `window.getSelection().toString()`（用户选中文本）
  - 如果没有选中文本，取 `document.body.innerText.slice(0, 8000)`
  - 获取 `window.location.hostname`
  - 生成 `new Date().toISOString()`
- [ ] `renderClipData(data)`：把采集的数据展示到 popup UI
- [ ] `copyJsonToClipboard()`：生成 JSON 字符串，复制到剪贴板，更新状态提示
- [ ] `openInternPilot()`：`chrome.tabs.create({ url: "http://localhost:8501" })`
- [ ] DOMContentLoaded 时调用 `collectPageData()`，绑定按钮事件

**采集的 JSON 格式：**
```json
{
  "page_title": "",
  "url": "",
  "selected_text": "",
  "page_text": "",
  "source_domain": "",
  "created_at": ""
}
```

> `selected_text` 和 `page_text` 互斥：有选中文本时 `page_text` 为空字符串

---

### 6.5 实现 `popup.css`

- [ ] 基础样式：字体、背景、间距
- [ ] info-card 样式：展示页面信息
- [ ] 主按钮：渐变蓝紫色背景
- [ ] 次按钮：浅色背景
- [ ] 状态提示：绿色成功 / 红色失败

---

### 6.6 验证插件 JSON 导入（Web App 侧）

- [ ] 确认 `modules/clip_parser.py` 已实现 `parse_clip_json()` 和 `clip_to_job_data()`
- [ ] 在岗位推荐页面 Tab 3，能粘贴 Clipper 生成的 JSON 并成功导入
- [ ] 导入后 `source` 字段 = `clipped`，`apply_url` 来自插件 JSON 的 `url`

---

### 6.7 在 Chrome 中加载插件

- [ ] 打开 `chrome://extensions/`
- [ ] 开启「开发者模式」
- [ ] 点击「加载已解压的扩展程序」
- [ ] 选择 `extension/` 目录
- [ ] 在工具栏找到 InternPilot Clipper 图标

---

### 6.8 测试清单

- [ ] 在 BOSS 直聘岗位页面点击插件，能显示页面标题和 URL
- [ ] 选中 JD 文本后点击插件，`selected_text` 正确
- [ ] 没有选中文本时，`page_text` 显示页面正文前 8000 字符
- [ ] 点击「复制为岗位 JSON」，状态提示显示「已复制」
- [ ] 粘贴到 InternPilot 导入页面，能成功保存为岗位

---

## 注意事项

### Manifest V3 限制
- **不能使用 `background.js` 长驻后台**（MV3 改为 service worker），但这个插件不需要后台，popup.js 足够
- **`clipboardWrite` 权限**：Manifest V3 中用 `navigator.clipboard.writeText()` 需要在有用户手势的情况下调用（点击事件内调用即可）
- **`scripting` 权限**：执行 `chrome.scripting.executeScript` 必须有此权限

### 常见问题
- **`chrome://extensions/` 不是网页，插件不能在此页面注入脚本**：测试时打开一个普通网页
- **popup 关闭后 JS 停止运行**：所有操作必须在 popup 打开期间完成，不需要后台持久化
- **localhost 访问**：插件调用 `http://localhost:8501` 打开 InternPilot，确保 Streamlit 在运行

### 页面文本质量
- BOSS、拉勾等招聘平台的 `innerText` 会包含大量导航栏文字，但这没关系——AI 解析会过滤
- 建议用户**先选中 JD 文本再点击插件**，这样 `selected_text` 质量更好
- 在 popup UI 上明确提示用户："选中 JD 文本后点击，效果更好"

### 不做的事（第一版严格限制）
- ❌ 不做自动翻页
- ❌ 不做批量采集
- ❌ 不做后端直连（所有数据走剪贴板 → 粘贴导入）
- ❌ 不做截图/OCR
- ❌ 不做验证码绕过

---

## Phase 3 完成标志

- [ ] 插件能在任意网页运行
- [ ] 能正确采集页面信息并生成 JSON
- [ ] 复制到剪贴板功能正常
- [ ] 粘贴到 Web App 能成功导入岗位
- [ ] 插件 UI 整洁，提示信息清晰

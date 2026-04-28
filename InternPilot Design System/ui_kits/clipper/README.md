# InternPilot Clipper — UI Kit

## Overview
Chrome extension popup UI (360px wide). Simulates saving a job posting from any job board.

## Running
Open `index.html` in a browser. The popup is centered on a gray background.

## Interactions
- **保存到求职库** — marks as saved (grays out button)
- **保存并分析** — triggers "analyzing" loading state → saved with match score
- **复制 JSON** — shows "已复制！" confirmation
- **JSON 数据 tab** — shows structured JSON preview

## Design Notes
- Fixed width: 360px
- No fixed height — content-driven (~520px)
- Header: Indigo #6366F1 brand bar
- Mock data: 小红书 数据分析实习生 from 实习僧

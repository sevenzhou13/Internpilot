---
name: internpilot-design
description: Use this skill to generate well-branded interfaces and assets for InternPilot, a personalized internship recommendation and resume adaptation system for graduate students. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping desktop web app screens and Chrome extension popups.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (screens, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key design facts to load immediately:
- Primary: Indigo #6366F1, Accent: Violet #8B5CF6
- Fonts: Plus Jakarta Sans (display/headings) + Inter (body) + JetBrains Mono (code)
- Cards: white bg, 1px #E5E7EB border, 12px radius, shadow-sm
- Page bg: #F8F9FB, Sidebar: 240px wide, white
- All CSS tokens in colors_and_type.css
- Sample data: 小红书/88%, 字节跳动/84%, 腾讯/79%; experiences in EXPERIENCES array in Sidebar.jsx
- Web app UI kit: ui_kits/web_app/index.html (8 screens, React/Babel)
- Clipper UI kit: ui_kits/clipper/index.html (360px Chrome popup)

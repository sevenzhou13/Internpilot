# InternPilot Design System

## Overview

**InternPilot** is a personalized internship recommendation and resume adaptation system targeting graduate students seeking internships. Target roles include Data Analysis, AI Product Manager, and User Research positions.

### Core Value Proposition
- Collect and organize job postings
- Build a personal experience library
- Calculate match scores between JDs and user experience
- Generate customized resume bullet points
- Generate interview preparation checklists
- AI-powered job search chat assistant

### Products
1. **InternPilot Web App** — 1440px desktop web application (primary product)
2. **InternPilot Clipper** — Chrome extension popup (360×520px) for saving job postings

---

## Sources
*No external codebase or Figma links were provided. Design system created from scratch based on product description and style direction: "Notion + Linear + OpenAI Dashboard".*

---

## Content Fundamentals

### Voice & Tone
- **Language:** Chinese (Simplified) primary UI copy; English for technical labels and codes
- **Tone:** Professional, calm, encouraging — like a smart career advisor, not a hype machine
- **Person:** Second-person ("你的") for user-facing copy; avoid excessive informality
- **Casing:** Sentence case for English labels; no ALL CAPS except status badges
- **Emoji:** Not used in UI; reserved for empty states or onboarding only
- **Numbers:** Match scores shown as integers (88%) not decimals; progress as percentages

### Copy Examples
- "根据你的经历，我们为你推荐了 12 个高匹配岗位"
- "匹配度 88% — 强烈推荐"
- "生成简历 Bullet Points"
- "开始面试准备"
- "添加经历" / "保存草稿"

---

## Visual Foundations

### Colors
- **Primary:** Blue-violet `#6366F1` (Indigo-500) — CTAs, links, active states
- **Primary Dark:** `#4F46E5` — hover states
- **Primary Light:** `#EEF2FF` — tinted backgrounds, selected states
- **Accent:** `#8B5CF6` (Violet-500) — secondary highlights, gradients
- **Background:** `#F8F9FB` — page background (very light gray-blue)
- **Surface:** `#FFFFFF` — card/panel backgrounds
- **Border:** `#E5E7EB` — card borders, dividers
- **Text Primary:** `#111827` — headings
- **Text Secondary:** `#6B7280` — body, labels
- **Text Muted:** `#9CA3AF` — placeholders, hints
- **Success:** `#10B981` — high match, positive states
- **Warning:** `#F59E0B` — medium match, pending
- **Danger:** `#EF4444` — low match, errors
- **Info:** `#3B82F6` — informational badges

### Typography
- **Display Font:** "Plus Jakarta Sans" — headings, hero text
- **Body Font:** "Inter" — body copy, labels, UI text
- **Mono Font:** "JetBrains Mono" — code, JSON, technical snippets
- Loaded from Google Fonts (substitution noted — no brand font files provided)

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Backgrounds
- Page background: flat `#F8F9FB` — no patterns, textures, or gradients
- Cards: flat white `#FFFFFF`
- Sidebar: white with subtle right border
- No full-bleed hero images in app; imagery used sparingly in empty states

### Cards
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Border radius: `12px` (cards), `8px` (inner elements), `6px` (badges)
- Box shadow: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- Hover shadow: `0 4px 12px rgba(0,0,0,0.08)`
- No colored left-border accents

### Animations
- Transitions: `150ms ease` for hover states; `200ms ease` for modals/panels
- No bouncy or springy animations — calm, linear-ish easing
- Subtle fade-in for page content (`opacity 0→1, 200ms`)
- No parallax, no heavy motion

### Hover & Press States
- Buttons: background darkens (primary: `#4F46E5`)
- Cards: shadow deepens + subtle `translateY(-1px)`
- Links: underline appears, color darkens
- Press: `scale(0.98)` on buttons

### Borders & Shadows
- Dividers: `1px solid #E5E7EB`
- Input focus ring: `0 0 0 3px rgba(99,102,241,0.15)`
- Elevated panel: `0 8px 24px rgba(0,0,0,0.08)`

### Corner Radii
- Page-level panels: `16px`
- Cards: `12px`
- Buttons: `8px`
- Badges/tags: `6px` (pill: `9999px`)
- Inputs: `8px`

### Imagery
- No photography in core UI
- Minimal geometric illustrations for empty states (line-art style)
- Color palette: cool blues and indigos matching brand

### Layout
- Max content width: `1440px`; centered
- Sidebar: `240px` fixed
- Main content: fluid, padded `32px`
- Top nav: `60px` fixed

---

## Iconography

### Approach
- **Icon set:** Lucide Icons (CDN: `https://unpkg.com/lucide@latest`)
- Stroke-based, 1.5px weight, 24px default size
- Used consistently throughout the app for nav, actions, status
- No filled icons, no emoji as icons
- Unicode chars: not used as icons

### Key Icons Used
- `briefcase` — Jobs
- `layout-dashboard` — Dashboard
- `book-open` — Experience Library
- `file-text` — Resume Generator
- `message-square` — AI Assistant
- `clipboard-list` — Interview Prep
- `chrome` — Clipper
- `plus`, `edit-2`, `trash-2` — CRUD actions
- `check-circle`, `clock`, `x-circle` — Status icons

---

## File Index

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← All CSS custom properties
assets/
  logo.svg                   ← InternPilot wordmark/logo
preview/
  colors-primary.html        ← Primary + accent color swatches
  colors-neutral.html        ← Neutral gray scale
  colors-semantic.html       ← Semantic (success/warning/danger/info)
  type-scale.html            ← Type scale specimen
  type-specimens.html        ← Font family specimens
  spacing-tokens.html        ← Spacing scale
  spacing-radii-shadows.html ← Radii + shadow system
  buttons.html               ← Button variants + states
  badges-tags.html           ← Badges, status tags
  cards.html                 ← Card variants
  inputs.html                ← Form inputs + selects
  nav-sidebar.html           ← Navigation sidebar
  match-score.html           ← Match score component
ui_kits/
  web_app/
    README.md
    index.html               ← Full interactive prototype (8 screens)
    Sidebar.jsx
    Dashboard.jsx
    Jobs.jsx
    JobDetail.jsx
    ExperienceLibrary.jsx
    ResumeGenerator.jsx
    InterviewPrep.jsx
    AIAssistant.jsx
  clipper/
    README.md
    index.html               ← Chrome extension popup
```

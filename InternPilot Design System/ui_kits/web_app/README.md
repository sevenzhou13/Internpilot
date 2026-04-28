# InternPilot Web App — UI Kit

## Overview
High-fidelity, interactive UI kit for the InternPilot desktop web app (1440px target). Built with React + Babel, runs entirely in-browser with no build step.

## Running
Open `index.html` in a browser. All screens are wired up as a click-through prototype.

## Screens
| Screen | File | Route key |
|---|---|---|
| Dashboard | Dashboard.jsx | `dashboard` |
| Jobs | Jobs.jsx | `jobs` |
| Job Detail | JobDetail.jsx | `jobDetail` |
| Experience Library | ExperienceLibrary.jsx | `experiences` |
| Resume Generator | ResumeGenerator.jsx | `resume` |
| Interview Prep | InterviewPrep.jsx | `interview` |
| AI Assistant | AIAssistant.jsx | `ai` |

## Shared Components (Sidebar.jsx)
- `<Sidebar active onNav>` — 240px nav
- `<Badge variant>` — pill labels
- `<MatchPill score>` — color-coded match %
- `<StatusTag status>` — application status
- `<Btn variant size>` — buttons
- `<MatchBar value>` — horizontal progress bar
- `<Icon d>` — inline SVG icon

## Sample Data (also in Sidebar.jsx)
- `JOBS_DATA` — 5 jobs (小红书/字节/腾讯/阿里/网易)
- `EXPERIENCES` — 4 experience entries with bullets

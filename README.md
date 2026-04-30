# Presence 🚀

Presence is a cross-platform desktop application powered by **Tauri** and **Nuxt**, designed to automate the generation of attendance and activity reports by syncing with GitLab activity, Jira, and Calendar events.

## ✨ Features

- 🖥️ **Desktop Native**: Fast and lightweight desktop app built with Tauri.
- 🔄 **GitLab & Jira Sync**: Automatically fetch commits, merge requests, and Jira issues.
- 📅 **Calendar Integration**: Import `.ics` calendar files to track meetings and events.
- 🤖 **AI Summary**: Automatically summarize your daily activities using **Google Gemini**, **OpenAI**, or local **Ollama** models.
- ⚡ **Sequential Batch Summary**: Generate summaries for the entire month with one click, optimized for local LLM stability.
- 📊 **Report Generation**: Generate structured daily, monthly, and yearly reports (Excel & Word).
- 🌙 **Modern UI**: Clean, responsive dashboard built with Nuxt 4, Tailwind CSS 4, and Shadcn Vue.

## 🛠️ Tech Stack

- **Frontend**: [Nuxt 4](https://nuxt.com/) (Vue 3.5+)
- **Desktop Bridge**: [Tauri v2](https://tauri.app/) (Rust)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn Vue](https://www.shadcn-vue.com/)
- **Database**: [SQLite](https://sqlite.org/) via [Tauri SQL Plugin](https://github.com/tauri-apps/plugins-workspace)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **AI Integration**: Google Gemini, OpenAI, Ollama (Local)

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v20.x or later)
- [Rust](https://www.rust-lang.org/tools/install) (required for Tauri)
- [Ollama](https://ollama.com/) (optional, for local AI)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/deanufriana/presence.git
cd presence
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Running the Application

Start the application in development mode:

```bash
npm run dev:tauri
```

This will launch the Nuxt development server and the Tauri window.

### 5. Building for Production

To build the standalone executable:

```bash
npm run build:tauri
```

The compiled binaries will be located in `src-tauri/target/release/bundle`.

## ⚙️ Configuration

Once the app is running, navigate to the **Settings** modal to configure:

1.  **Integrations**: GitLab Token, Jira Host/Email/Token.
2.  **AI Provider**: API Keys for Gemini/OpenAI or Ollama endpoint.
3.  **Project Selection**: Select which GitLab projects to sync activity from.

## 📄 License

This project is licensed under the MIT License.

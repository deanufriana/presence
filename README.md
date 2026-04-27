# Presence AI 🚀

Presence is an AI-powered attendance and activity reporting system designed to automate the generation of daily and monthly reports by syncing with GitLab activity and Calendar events.

![Presence Dashboard](https://raw.githubusercontent.com/deanufriana/presence/main/app/assets/images/preview.png) *(Note: Placeholder for actual preview)*

## ✨ Features

- 🔄 **GitLab Sync**: Automatically fetch commits and merge requests from multiple projects.
- 📅 **Calendar Integration**: Import `.ics` calendar files to track meetings and events.
- 🤖 **AI Summary**: Automatically summarize your daily activities using **Google Gemini**, **OpenAI**, or local **Ollama** models.
- ⚡ **Sequential Batch Summary**: Generate summaries for the entire month with one click, processed sequentially to ensure stability for local LLMs.
- 📊 **Report Generation**: Generate structured daily and monthly reports with ease.
- 🌙 **Modern UI**: Clean, responsive dashboard built with Nuxt 4, Tailwind CSS 4, and highly customized Shadcn components.

## 🛠️ Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3.5+)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn Vue](https://www.shadcn-vue.com/) with custom design variants
- **Database & ORM**: [Prisma](https://www.prisma.io/) with SQLite
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **AI Integration**:
  - [Google Gemini](https://ai.google.dev/)
  - [OpenAI](https://openai.com/)
  - [Ollama](https://ollama.com/) (Local LLMs like Gemma, DeepSeek, etc.)

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Ollama](https://ollama.com/) (optional, for local AI)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/deanufriana/presence.git
cd presence
npm install
```

### 3. Environment Setup

Copy the example environment file and adjust the settings if necessary:

```bash
cp .env.example .env
```

By default, the project uses a local SQLite database:
```env
DATABASE_URL="file:/Users/deanufriana/Project/brilife/presence/prisma/dev.db"
```

### 4. Database Initialization

Run Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev --name init
```

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## ⚙️ Configuration

Once the app is running, navigate to the **Settings** modal in the dashboard to configure:

1.  **GitLab Connection**:
    *   `GitLab URL`: Your GitLab instance URL (default: `https://gitlab.com`).
    *   `GitLab Token`: Your Personal Access Token.
2.  **AI Provider**:
    *   **Gemini**: Enter your Google AI Studio API Key.
    *   **OpenAI**: Enter your OpenAI API Key.
    *   **Ollama**: Connect to a local Ollama instance (default: `http://localhost:11434`). It will automatically fetch your downloaded models (e.g., `gemma:latest`, `deepseek-r1:latest`).
3.  **Project Selection**:
    *   Select which GitLab projects you want to sync activity from.

## 📖 Usage

1.  **Sync Activities**: Click the **Sync Activities** button to fetch latest data from GitLab.
2.  **Import Calendar**: Use the **Import Calendar** button to upload your `.ics` file.
3.  **Generate Reports**:
    *   **Individual**: Click the Sparkle icon on any day to summarize that specific day.
    *   **Batch (Summarize All)**: Click the **Summarize All** button in the Daily Report header. It will process all days in the month sequentially with a short breather between requests to handle local LLM processing smoothly.
4.  **Month Picker**: Use the refactored Month Picker component to quickly navigate between months.
5.  **Edit & Save**: You can manually edit any field before saving the report to the database.

## 📄 License

This project is licensed under the MIT License.

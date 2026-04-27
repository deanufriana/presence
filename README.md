# Presence AI 🚀

Presence is an AI-powered attendance and activity reporting system designed to automate the generation of daily and monthly reports by syncing with GitLab activity and Calendar events.

![Presence Dashboard](https://raw.githubusercontent.com/deanufriana/presence/main/app/assets/images/preview.png) *(Note: Placeholder for actual preview)*

## ✨ Features

- 🔄 **GitLab Sync**: Automatically fetch commits and merge requests from multiple projects.
- 📅 **Calendar Integration**: Import `.ics` calendar files to track meetings and events.
- 🤖 **AI Summary**: Automatically summarize your daily activities using Google Gemini or OpenAI.
- 📊 **Report Generation**: Generate structured daily and monthly reports with ease.
- 🌙 **Modern UI**: Clean, responsive dashboard built with Nuxt 4, Tailwind CSS, and Shadcn.

## 🛠️ Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn Vue](https://www.shadcn-vue.com/)
- **Database & ORM**: [Prisma](https://www.prisma.io/) with SQLite
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/) & [OpenAI](https://openai.com/)

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

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
DATABASE_URL="file:./prisma/dev.db"
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
    *   Choose between **Gemini** or **OpenAI**.
    *   Enter your **API Key**.
3.  **Project Selection**:
    *   Select which GitLab projects you want to sync activity from.

## 📖 Usage

1.  **Sync Activities**: Click the **Sync Activities** button to fetch latest data from GitLab.
2.  **Import Calendar**: Use the **Import Calendar** button to upload your `.ics` file.
3.  **Generate Reports**: Navigate to the Daily or Monthly tab. Use the **Generate AI** button to let the AI summarize your work based on synced activity.
4.  **Edit & Save**: You can manually edit any field before saving the report to the database.

## 📄 License

This project is licensed under the MIT License.

# 🧠 AI Question Generator

A modern, full-stack AI-powered educational assessment platform that automatically generates Multiple Choice Questions (MCQs) and Creative Questions (CQs) from uploaded PDF documents, images, or custom topics using **Google Gemini AI**.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?logo=google)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com/)

---

## 🌟 Key Features

- 📄 **Smart Document Parsing**: Upload educational PDFs and extract selectable text automatically with support for `pdf-parse` v2 and v1.
- 🎯 **Dual Question Types**:
  - **Multiple Choice Questions (MCQ)**: Generates 4 options, marks the correct answer, and includes detailed step-by-step explanations.
  - **Creative Questions (CQ / সৃজনশীল)**: Generates structured questions (Knowledge, Comprehension, Application, Higher Ability - ক, খ, গ, ঘ) based on context.
- 🔒 **User Privacy & Authentication**:
  - Secure Google Sign-In via Firebase Auth.
  - **Strict User Isolation**: Users can only see, generate, and manage their own uploaded files and question sets.
- 🌐 **Multi-Language & Custom Difficulty**:
  - Generates questions in English or Bengali (বাংলা).
  - Configurable difficulty: `Easy`, `Medium`, `Hard`.
- 📊 **Question Set Management**:
  - Edit question text, answers, and explanations.
  - Regenerate individual questions with one click.
  - Export sets to PDF, print, or copy to clipboard.
- 📱 **Responsive & Modern UI**: Built with dark-mode glassmorphism, responsive navigation, and intuitive interactive controls.

---

## 🏗️ Architecture & Tech Stack

```
ai-question-generator/
├── backend/                  # NestJS RESTful API
│   ├── api/index.ts          # Vercel Serverless Function entry point
│   ├── src/
│   │   ├── ai/               # Google Gemini AI integration
│   │   ├── auth/             # Authentication guards & user management
│   │   ├── documents/        # PDF upload, storage & text extraction
│   │   ├── questions/        # Question generation & CRUD management
│   │   └── prisma/           # Supabase PostgreSQL database service
│   ├── prisma/schema.prisma  # Database schema definitions
│   └── vercel.json           # Backend Vercel deployment configuration
│
└── frontend/                 # React + Vite Client Application
    ├── src/
    │   ├── api/              # Axios HTTP client configuration
    │   ├── components/       # Reusable UI components & modals
    │   ├── context/          # AuthContext (Firebase Google Sign-In state)
    │   ├── firebase/         # Firebase Client SDK configuration
    │   └── pages/            # Dashboard, Upload, and Generator pages
    └── vite.config.ts        # Vite configuration
```

---

## ⚙️ Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`
- **Database**: PostgreSQL (Supabase recommended)
- **API Keys**:
  - [Google AI Studio](https://aistudio.google.com/) for `GEMINI_API_KEY`
  - [Firebase Console](https://console.firebase.google.com/) for Google Authentication credentials

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mjunayed2003/ai-question-genetator.git
cd ai-question-genetator
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   pnpm install
   ```

2. Create a `.env` file in `backend/`:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Database Configuration (Supabase PostgreSQL Connection Pooler)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

   # AI Provider Configuration (Google Gemini)
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash

   # File Upload Configuration
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE_MB=15
   ```

3. Generate Prisma Client and sync schema:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

4. Start the backend development server:
   ```bash
   pnpm run start:dev
   ```
   - 📍 **Base URL**: `http://localhost:3000`
   - 📖 **Swagger API Docs**: `http://localhost:3000/api/docs`

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   pnpm install
   ```

2. Create a `.env` file in `frontend/`:
   ```env
   # Backend API Base URL
   VITE_API_URL=http://localhost:3000

   # Firebase Authentication Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. Start the frontend development server:
   ```bash
   pnpm run dev
   ```
   - 🌐 App will be running at: `http://localhost:5173`

---

## ☁️ Deployment Guide (Vercel)

Both Frontend and Backend can be deployed on Vercel as two separate projects:

### A. Deploy Backend to Vercel
1. Import the repository into Vercel.
2. In Project Settings, set **Root Directory** to `backend`.
3. Add the following **Environment Variables** in Vercel:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `AI_PROVIDER`: `gemini`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: URL of your deployed frontend (e.g., `https://question-genetator-ai.vercel.app`).
4. Deploy the project.

### B. Deploy Frontend to Vercel
1. Import the repository into Vercel.
2. In Project Settings, set **Root Directory** to `frontend`.
3. Add the following **Environment Variables** as **Config** (`visibility: config`):
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://ai-question-genetator.vercel.app`).
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy the project.
5. In **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**, add your Vercel frontend domain (e.g., `question-genetator-ai.vercel.app`).

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/documents/upload` | Upload PDF/image file and extract text |
| `GET` | `/documents` | List uploaded documents for the authenticated user |
| `DELETE` | `/documents/:id` | Delete an uploaded document |
| `POST` | `/questions/generate` | Generate questions via AI from document/topic |
| `GET` | `/questions/sets` | List generated question sets |
| `GET` | `/questions/sets/:id` | Get question set details with MCQs and CQs |
| `PATCH` | `/questions/mcqs/:id` | Update an individual MCQ |
| `PATCH` | `/questions/cqs/:id` | Update an individual CQ |
| `DELETE` | `/questions/sets/:id` | Delete a question set |

Interactive Swagger documentation is available at `/api/docs`.

---

## 📄 License

This project is licensed under the [UNLICENSED](LICENSE) license for private and educational use.

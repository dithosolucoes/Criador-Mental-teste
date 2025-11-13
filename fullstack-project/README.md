# Guardião da Cyca - Full Stack Supabase Project

This is a production-ready, full-stack version of the "Guardião da Cyca v1" application, transformed to use Supabase for its backend, including database, authentication, storage, and edge functions.

## Features

*   **Secure Backend:** All sensitive operations and API keys (except for the real-time audio streaming) are handled by Supabase Edge Functions, keeping them off the client.
*   **User Authentication:** A simple login system is in place to manage user sessions.
*   **Persistent Data:** All user data (profile, medications, exams, etc.) is stored in a Supabase PostgreSQL database.
*   **File Storage:** Exam results and important documents are securely uploaded to Supabase Storage.
*   **Scalable AI Operations:** AI-powered features are implemented as serverless Edge Functions, which securely wrap the Google Gemini API.

## Supabase Setup

Follow these steps to set up your Supabase backend.

### 1. Install the Supabase CLI

If you haven't already, install the Supabase CLI:

```bash
npm i -g supabase
```

### 2. Log in to the CLI

Log in to your Supabase account. You'll need to generate a personal access token.

```bash
supabase login
```

### 3. Link Your Project

Navigate to your project's root directory in the terminal. Link this local project to your remote Supabase project.

```bash
supabase link --project-ref YOUR_PROJECT_REF
# You can find YOUR_PROJECT_REF in your project's URL: https://app.supabase.com/project/YOUR_PROJECT_REF
```

### 4. Push Database Migrations

The local database schema is defined in `supabase/migrations`. Push this schema to your remote Supabase database.

```bash
supabase db push
```

This will create all the necessary tables, enable Row Level Security, and set up Storage buckets.

### 5. Deploy Edge Functions

The backend logic for AI operations is located in `supabase/functions`. Deploy them:

```bash
supabase functions deploy
```

### 6. Set Environment Variables

Your Edge Functions need the Gemini API key to work. Set this secret for your Supabase project.

```bash
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key
```

### 7. Seed Initial Data (Optional but Recommended)

To test the application immediately, you need a test user and some initial data. The `supabase/seed.sql` file contains sample data.

The easiest way to run this is to use the `db reset` command, which will wipe the remote database and run the seed file. **Warning: This is a destructive operation.**

```bash
supabase db reset
```

Alternatively, you can copy the contents of `supabase/seed.sql` and run it in the SQL Editor in your Supabase project dashboard.

## Frontend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, fill in the `.env` file with your Supabase project details and your Gemini API key.

*   `VITE_SUPABASE_URL`: Found in your Supabase project's API settings.
*   `VITE_SUPABASE_ANON_KEY`: Found in your Supabase project's API settings.
*   `VITE_GEMINI_API_KEY`: Your Google Gemini API Key. This is only used for the live voice chat feature.

### 3. Run the App

```bash
npm run dev
```

Your application should now be running locally, fully connected to your Supabase backend!

# URL Shortener

A full-stack URL shortener with click analytics, built with .NET 10, Next.js 16, and Azure Cosmos DB. The backend exposes a minimal REST API secured with Google OAuth and JWT, while the frontend provides a dashboard for managing links and exploring traffic data. The project is orchestrated locally with .NET Aspire and deploys to Azure Container Apps using the Azure Developer CLI.

## Features

- **URL Shortening** — auto-generated 6-character codes or custom aliases
- **Redirect Tracking** — records IP, referrer, and user-agent on each click
- **Analytics Dashboard** — 14-day click history, top referrers, and recent clicks
- **Google OAuth** — sign in with Google, JWT-based session management
- **Per-user isolation** — users can only manage their own URLs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | ASP.NET Core (.NET 10), Minimal APIs |
| Auth | Google OAuth 2.0, JWT Bearer, NextAuth |
| Database | Azure Cosmos DB |
| Orchestration | .NET Aspire |
| Deployment | Azure Container Apps (`azd`) |

## Project Structure

```
url-shortener/
├── url-shortener.AppHost/       # Aspire orchestration entry point
├── url-shortener.backend/       # ASP.NET Core REST API
│   ├── Controllers/             # URL, Auth, Analytics, Redirect
│   ├── Models/                  # ShortenedUrl, AppUser, AnalyticEvent
│   ├── Repositories/            # Cosmos DB data access
│   └── Services/                # Code generation, analytics logic
├── url-shortener.ServiceDefaults/ # Shared Aspire service config
├── url-shortner.frontend/       # Next.js application
│   ├── app/dashboard/           # URL management + analytics pages
│   ├── app/api/                 # Next.js API routes (proxy to backend)
│   └── lib/                     # API clients, auth config
├── azure.yaml                   # Azure Developer CLI config
└── deploy.ps1                   # Production deployment script
```

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Cosmos DB emulator)
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com/))

### Configuration

Create `url-shortener.AppHost/appsettings.json`:

```json
{
  "Jwt": {
    "Secret": "<your-jwt-secret>"
  },
  "NextAuth": {
    "Secret": "<your-nextauth-secret>",
    "Url": "http://localhost:3000"
  },
  "Google": {
    "ClientId": "<your-google-client-id>",
    "ClientSecret": "<your-google-client-secret>"
  },
  "Cors": {
    "ExtraOrigins": "http://localhost:3000"
  },
  "UrlDomain": "<your-domain>"
}
```

### Run with Aspire (recommended)

Aspire orchestrates the backend, frontend, and Cosmos DB emulator together:

```bash
dotnet run --project url-shortener.AppHost
```

This starts the Aspire dashboard, the backend API, the frontend, and a local Cosmos DB emulator — with service discovery wired automatically.

### Run manually

**Backend:**
```bash
dotnet run --project url-shortener.backend
```

**Frontend:**
```bash
cd url-shortner.frontend
npm install
npm run dev
```

## Deployment

The project deploys to Azure Container Apps using the [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/):

```powershell
.\deploy.ps1
```

Or manually:
```bash
azd up
```

This provisions Azure Cosmos DB, builds and pushes container images, and deploys both services to Azure Container Apps.

## API Overview

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/google` | Exchange Google ID token for JWT |
| `GET` | `/api/urls` | List all URLs for the authenticated user |
| `POST` | `/api/urls` | Create a shortened URL |
| `DELETE` | `/api/urls/{shortCode}` | Delete a URL and its analytics |
| `GET` | `/{shortCode}` | Redirect to the original URL |
| `GET` | `/api/analytics/{shortCode}` | Get analytics for a short code |

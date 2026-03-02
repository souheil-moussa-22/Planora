# Planora

Planora is a project-management web application built with an **ASP.NET Core (.NET 10)** backend and an **Angular 17** frontend.

---

## Prerequisites

Make sure the following tools are installed before you begin:

| Tool | Minimum version | Notes |
|------|----------------|-------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 | `dotnet --version` to verify |
| [Node.js](https://nodejs.org/) | 18 LTS | includes `npm`; `node -v` to verify |
| [Angular CLI](https://angular.io/cli) | 17 | `npm install -g @angular/cli` |
| SQL Server | any edition | LocalDB (ships with Visual Studio) works for local dev |
| [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) | — | `dotnet tool install --global dotnet-ef` |

---

## 1 – Clone the repository

```bash
git clone https://github.com/souheil-moussa-22/Planora.git
cd Planora
```

---

## 2 – Configure the backend

### 2.1 Connection string

Open `Planora/appsettings.json` and update `ConnectionStrings:DefaultConnection` to point at your SQL Server instance:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=PlanoraDev;Trusted_Connection=True;MultipleActiveResultSets=true"
}
```

> **Tip:** Use [.NET User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) to keep credentials out of source control:
> ```bash
> cd Planora
> dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-connection-string"
> ```

### 2.2 JWT secret key (optional for local dev)

A default secret is already set in `appsettings.json`. For production, override it with an environment variable or user secret:

```bash
dotnet user-secrets set "JwtSettings:SecretKey" "YourSuperSecretKeyHere"
```

### 2.3 OpenAI API key (optional – required for chatbot feature)

```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
```

---

## 3 – Apply database migrations

Run the following command from the **repository root**. This creates the database and applies all pending EF Core migrations:

```bash
dotnet ef database update --project Planora.Infrastructure --startup-project Planora
```

---

## 4 – Run the backend API

```bash
cd Planora
dotnet run
```

The API will start at **`https://localhost:7xxx`** (the exact port is shown in the console output).  
Swagger UI is available at **`https://localhost:<port>/swagger`** in the Development environment.

---

## 5 – Run the frontend

Open a **new terminal**, then:

```bash
cd planora-frontend
npm install        # install dependencies (first time only)
npm start          # or: ng serve
```

The Angular dev server starts at **[http://localhost:4200](http://localhost:4200)**.  
The app reloads automatically when you edit source files.

---

## 6 – Using the application

1. Open your browser and navigate to **[http://localhost:4200](http://localhost:4200)**.
2. Register a new account or log in with an existing account.
3. Explore the Swagger UI at **`https://localhost:<api-port>/swagger`** to test API endpoints directly.

---

## Project structure

```
Planora/                  → ASP.NET Core Web API (entry point)
Planora.Application/      → Application layer (use cases, interfaces, DTOs)
Planora.Domain/           → Domain layer (entities, domain interfaces)
Planora.Infrastructure/   → Infrastructure layer (EF Core, Identity, JWT, services)
planora-frontend/         → Angular 17 frontend
Planora.slnx              → .NET solution file
```

---

## Useful commands

| Task | Command |
|------|---------|
| Restore NuGet packages | `dotnet restore` |
| Build the solution | `dotnet build` |
| Add a new EF migration | `dotnet ef migrations add <Name> --project Planora.Infrastructure --startup-project Planora` |
| Run backend unit tests | `dotnet test` |
| Run frontend unit tests | `cd planora-frontend && ng test` |
| Build Angular for production | `cd planora-frontend && ng build` |

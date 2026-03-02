# Planora

Planora is a project-management web application built with:

- **Backend** – ASP.NET Core (.NET 10), Entity Framework Core, SQL Server, JWT authentication
- **Frontend** – Angular 17, Angular Material

---

## Prerequisites

| Tool | Minimum version | Download |
|------|----------------|---------|
| .NET SDK | 10.0 | https://dotnet.microsoft.com/download |
| Node.js (includes npm) | 18 LTS | https://nodejs.org |
| Angular CLI | 17 | `npm install -g @angular/cli` |
| SQL Server | 2019 / LocalDB | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |

> **LocalDB** ships with Visual Studio and is the default connection string.  
> If you use a full SQL Server instance, update the connection string in the next step.

---

## 1 – Clone the repository

```bash
git clone https://github.com/souheil-moussa-22/Planora.git
cd Planora
```

---

## 2 – Configure the backend

### 2a – Connection string

Open `Planora/appsettings.json` and update the `DefaultConnection` value if needed:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=PlanoraDev;Trusted_Connection=True;MultipleActiveResultSets=true"
}
```

For a full SQL Server instance, use a connection string like:

```
Server=localhost;Database=PlanoraDev;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
```

### 2b – JWT secret key

The default secret key in `appsettings.json` is suitable for local development only.  
For production, override it with an environment variable:

```bash
# Windows (PowerShell)
$env:JwtSettings__SecretKey="<your-strong-secret-key>"

# Linux / macOS
export JwtSettings__SecretKey="<your-strong-secret-key>"
```

### 2c – OpenAI API key (optional – required for the AI chatbot)

```bash
# Windows (PowerShell)
$env:OpenAI__ApiKey="<your-openai-api-key>"

# Linux / macOS
export OpenAI__ApiKey="<your-openai-api-key>"
```

Alternatively, store secrets locally with the .NET Secret Manager:

```bash
cd Planora
dotnet user-secrets set "OpenAI:ApiKey" "<your-openai-api-key>"
```

---

## 3 – Apply database migrations

From the repository root, run:

```bash
dotnet ef database update --project Planora.Infrastructure --startup-project Planora
```

> If you don't have the EF CLI tool, install it first:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

---

## 4 – Run the backend

```bash
cd Planora
dotnet run
```

The API will be available at **http://localhost:5070**.  
Swagger UI is available at **http://localhost:5070/swagger** (Development environment only).

---

## 5 – Run the frontend

Open a **new terminal** from the repository root:

```bash
cd planora-frontend
npm install
ng serve
```

The Angular application will be available at **http://localhost:4200**.

---

## Project structure

```
Planora/                    ← ASP.NET Core Web API (entry point)
Planora.Application/        ← Application layer (use cases, DTOs, interfaces)
Planora.Domain/             ← Domain layer (entities, enums)
Planora.Infrastructure/     ← Infrastructure layer (EF Core, repositories, services)
planora-frontend/           ← Angular 17 frontend
Planora.slnx                ← .NET solution file
```

---

## Common commands

| Task | Command |
|------|---------|
| Build backend | `dotnet build` |
| Run backend tests | `dotnet test` |
| Add a new EF migration | `dotnet ef migrations add <Name> --project Planora.Infrastructure --startup-project Planora` |
| Build frontend | `cd planora-frontend && ng build` |
| Run frontend unit tests | `cd planora-frontend && ng test` |

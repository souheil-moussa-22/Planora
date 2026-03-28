# Planora — Architecture Overview

Planora is organized as a **Clean Architecture / layered architecture** .NET solution with a separate Angular frontend. The core business rules live in **Domain**, application use-cases in **Application**, technical plumbing in **Infrastructure**, and the HTTP entry-point in the **Planora** API host project. The Angular SPA in `planora-frontend/` communicates with the backend exclusively through the HTTP API.

---

## High-Level Diagram

```
┌─────────────────────────┐        HTTP / REST        ┌──────────────────────────────────────┐
│   planora-frontend      │ ─────────────────────────► │   Planora  (ASP.NET Core API host)   │
│   (Angular 17 SPA)      │                            │   Controllers · Middleware · DI root │
└─────────────────────────┘                            └──────────────┬───────────────────────┘
                                                                       │ depends on
                                                          ┌────────────▼────────────┐
                                                          │   Planora.Application   │
                                                          │   Use-cases · DTOs      │
                                                          │   Validators · Mappings │
                                                          └────────────┬────────────┘
                                                                       │ depends on
                                                          ┌────────────▼────────────┐
                                                          │     Planora.Domain      │
                                                          │  Entities · Enums       │
                                                          │  Interfaces (IRepo, UoW)│
                                                          └─────────────────────────┘
                                                                       ▲
                                                                       │ implements
                                                          ┌────────────┴────────────┐
                                                          │  Planora.Infrastructure │
                                                          │  EF Core · Identity     │
                                                          │  Repositories · Services│
                                                          │  Migrations             │
                                                          └─────────────────────────┘
```

**Dependency direction (innermost = no external dependencies):**

```
Planora (API) → Application → Domain
                              ↑
              Infrastructure ─┘
```

---

## Backend Project Breakdown

### `Planora.Domain/`

The innermost layer — no references to frameworks or databases.

| Sub-folder  | Contents |
|-------------|----------|
| `Entities/` | Core business objects: `Project`, `Sprint`, `TaskItem`, `BacklogItem`, `Comment`, `ProjectMember`, `ApplicationUser` (extends `IdentityUser`), and the shared `BaseEntity` base class (`Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`). |
| `Enums/`    | Domain enumerations, e.g. `TaskStatus` (`ToDo / InProgress / Done`) and `TaskPriority` (`Low / Medium / High`). |
| `Interfaces/` | Abstractions consumed by the Application layer: `IRepository<T>` (generic repository) and `IUnitOfWork` (exposes per-aggregate repositories and `SaveChangesAsync()`). |

> **Key design choice:** The Application layer only sees interfaces from Domain — it never imports Entity Framework directly.

---

### `Planora.Application/`

The use-case layer. References only `Planora.Domain`.

| Sub-folder / File  | Contents |
|--------------------|----------|
| `DTOs/`            | Request and response data-transfer objects used across the API boundary. |
| `Interfaces/`      | Application-level service contracts (e.g. email, token generation) implemented by Infrastructure. |
| `Mappings/`        | **AutoMapper** profiles that map between DTOs and Domain entities. |
| `Validators/`      | **FluentValidation** validators for incoming request DTOs. |
| `DependencyInjection.cs` | Extension method that registers Application services into the DI container. |

Key NuGet packages: `AutoMapper`, `FluentValidation.AspNetCore`.

---

### `Planora.Infrastructure/`

The technical-implementation layer. References `Planora.Domain` (and optionally `Planora.Application` for service interfaces).

| Sub-folder / File  | Contents |
|--------------------|----------|
| `Data/`            | EF Core `DbContext` and entity configurations. |
| `Migrations/`      | EF Core migration files generated from the `DbContext`. |
| `Repositories/`    | Concrete implementations of `IRepository<T>` and `IUnitOfWork`. |
| `Identity/`        | ASP.NET Core Identity setup, JWT token generation, auth helpers. |
| `Services/`        | Implementations of application-level service interfaces (e.g. email, file storage). |
| `DependencyInjection.cs` | Extension method that registers all Infrastructure services (DbContext, repositories, identity, etc.) into the DI container. |

> **Cleanup note:** The folder `Planora.Infrastructure/bin/Debug` appears to have been accidentally committed to the repository (likely build output). It is recommended to delete it, add `bin/` and `obj/` to `.gitignore` (if not already present), and push the cleanup as a separate commit.

---

### `Planora/` (API Host)

The outermost backend layer — the ASP.NET Core Web API entry point.

| File / Folder       | Purpose |
|---------------------|---------|
| `Program.cs`        | Application startup: builds the host, registers services from Application + Infrastructure DI helpers, configures the middleware pipeline. |
| `Controllers/`      | HTTP controllers/endpoints. Each controller delegates to Application use-cases. |
| `Middleware/`       | Custom middleware (e.g. global exception handling). |
| `appsettings.json` / `appsettings.Development.json` | Configuration (connection strings, JWT settings, etc.). |
| `Properties/`       | Launch settings. |

> **Cleanup note:** Similar to Infrastructure, a `bin/Debug` folder appears to have been committed here and should be removed.

---

## Frontend — `planora-frontend/`

A standalone **Angular 17** single-page application generated with Angular CLI.

| Path      | Purpose |
|-----------|---------|
| `src/`    | Application source (components, services, routing, models). |
| `angular.json` | Angular workspace configuration. |
| `tsconfig.json` | TypeScript configuration. |
| `package.json` | npm dependencies and scripts. |

The frontend communicates with the backend through the REST API exposed by the `Planora` host. UI concerns (routing, components, state management) are fully separated from the backend.

---

## Typical Request Flow (Example: "Create a Sprint")

```
1. planora-frontend
     Angular service calls POST /api/sprints with a JSON body.

2. Planora (API host)
     SprintsController receives the request and passes the DTO to the Application layer.

3. Planora.Application
     a. FluentValidation validator checks the DTO (returns 400 if invalid).
     b. AutoMapper maps the DTO → Sprint domain entity.
     c. IUnitOfWork.Sprints.AddAsync(sprint) is called.

4. Planora.Infrastructure
     The EF Core repository implementation adds the entity to the DbContext.
     IUnitOfWork.SaveChangesAsync() commits the transaction.

5. Response flows back
     Application returns a response DTO → Controller → HTTP 201 Created → frontend.
```

---

## Notes & Limitations

- The descriptions above are based on the visible folder structure and project files. Some implementation details (e.g. exact service contracts, controller action names) may differ — always check the actual source files for the authoritative picture.
- To explore further, browse the following folders directly in GitHub:
  - [`Planora.Domain/`](../Planora.Domain)
  - [`Planora.Application/`](../Planora.Application)
  - [`Planora.Infrastructure/`](../Planora.Infrastructure)
  - [`Planora/`](../Planora)
  - [`planora-frontend/`](../planora-frontend)

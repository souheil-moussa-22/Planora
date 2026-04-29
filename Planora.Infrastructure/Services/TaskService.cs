// Planora.Infrastructure/Services/TaskService.cs
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planora.Application.DTOs.Common;
using Planora.Application.DTOs.Tasks;
using Planora.Application.Interfaces;
using Planora.Domain.Entities;
using Planora.Domain.Interfaces;
using Planora.Infrastructure.Data;

namespace Planora.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<TaskService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public TaskService(IUnitOfWork unitOfWork, IMapper mapper, ApplicationDbContext dbContext, IEmailService emailService, ILogger<TaskService> logger, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
        _userManager = userManager;
    }

    public async Task<PaginatedResultDto<TaskDto>> GetTasksAsync(Guid projectId, int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(t => t.ProjectId == projectId, page, pageSize);
        var dtos = _mapper.Map<IEnumerable<TaskDto>>(tasks);

        return new PaginatedResultDto<TaskDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResultDto<TaskDto>> GetAllTasksAsync(int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(t => !t.IsDeleted, page, pageSize);
        var dtos = _mapper.Map<IEnumerable<TaskDto>>(tasks);

        return new PaginatedResultDto<TaskDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResultDto<TaskDto>> GetTasksByProjectIncludingClosedSprintsAsync(Guid projectId, int page, int pageSize)
    {
        var (tasks, total) = await _unitOfWork.Tasks.GetPagedAsync(
            t => t.ProjectId == projectId && !t.IsDeleted,
            page,
            pageSize);

        var dtos = _mapper.Map<IEnumerable<TaskDto>>(tasks);

        return new PaginatedResultDto<TaskDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<TaskDto?> GetTaskByIdAsync(Guid id)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id);
        return task == null ? null : _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, string currentUserId)
    {
        await EnsureProjectMemberAccessAsync(dto.ProjectId, currentUserId);

        var task = _mapper.Map<TaskItem>(dto);
        task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;
        task.Status = Domain.Enums.TaskStatus.ToDo;

        await _unitOfWork.Tasks.AddAsync(task);
        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(dto.AssignedToId))
            await TrySendTaskAssignmentEmailAsync(task, dto.ProjectId);

        return _mapper.Map<TaskDto>(task);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskDto dto, string currentUserId)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");
        await EnsureProjectMemberAccessAsync(task.ProjectId, currentUserId);

        var previousAssignedToId = task.AssignedToId;
        _mapper.Map(dto, task);
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(task.AssignedToId) && task.AssignedToId != previousAssignedToId)
            await TrySendTaskAssignmentEmailAsync(task, task.ProjectId);

        return _mapper.Map<TaskDto>(task);
    }

    public async Task DeleteTaskAsync(Guid id, string currentUserId)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(id) ?? throw new KeyNotFoundException("Task not found.");
        await EnsureProjectMemberAccessAsync(task.ProjectId, currentUserId);

        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Tasks.Update(task);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task TrySendTaskAssignmentEmailAsync(TaskItem task, Guid projectId)
    {
        var assignedToId = task.AssignedToId;

        _logger.LogInformation(
            "TrySendTaskAssignmentEmailAsync invoked for task {TaskId} (project {ProjectId}, assignee {AssigneeId}).",
            task.Id, projectId, assignedToId ?? "(none)");

        if (string.IsNullOrWhiteSpace(assignedToId))
        {
            _logger.LogInformation("Task {TaskId} has no assignee — skipping assignment email.", task.Id);
            return;
        }

        var assignedUser = await _userManager.FindByIdAsync(assignedToId);
        if (assignedUser == null)
        {
            _logger.LogWarning("Task {TaskId}: assignee user {AssigneeId} not found — skipping assignment email.", task.Id, assignedToId);
            return;
        }

        if (string.IsNullOrWhiteSpace(assignedUser.Email))
        {
            _logger.LogWarning("Task {TaskId}: assignee {AssigneeId} has no email address — skipping assignment email.", task.Id, assignedToId);
            return;
        }

        var project = await _dbContext.Projects
            .Include(p => p.ProjectManager)
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
        {
            _logger.LogWarning("Task {TaskId}: project {ProjectId} not found — skipping assignment email.", task.Id, projectId);
            return;
        }

        var pmName = project.ProjectManager != null
            ? $"{project.ProjectManager.FirstName} {project.ProjectManager.LastName}".Trim()
            : string.Empty;

        _logger.LogInformation(
            "Sending task assignment email for task {TaskId} to {Email} (project '{ProjectName}', PM '{PmName}').",
            task.Id, assignedUser.Email, project.Name, pmName);

        try
        {
            await _emailService.SendTaskAssignmentAsync(
                assignedUser.Email,
                assignedUser.FullName,
                task.Title,
                task.Description ?? string.Empty,
                task.DueDate,
                task.Priority.ToString(),
                project.Name,
                pmName);

            _logger.LogInformation("Task assignment email sent successfully for task {TaskId} to {Email}.", task.Id, assignedUser.Email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send task assignment email for task {TaskId} to {Email}. Task operation is unaffected.", task.Id, assignedUser.Email);
        }
    }

    private async Task EnsureProjectMemberAccessAsync(Guid projectId, string userId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Workspace)
            .FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new KeyNotFoundException("Project not found.");

        var isProjectMember = await _dbContext.ProjectUsers
            .AnyAsync(pu => pu.ProjectId == projectId && pu.UserId == userId);

        var isWorkspaceMember = await _dbContext.WorkspaceUsers
            .AnyAsync(wu => wu.WorkspaceId == project.WorkspaceId && wu.UserId == userId);

        var canAccess = project.Workspace.OwnerId == userId || project.ProjectManagerId == userId || isProjectMember || isWorkspaceMember;
        if (!canAccess)
            throw new UnauthorizedAccessException("Only project members can manage tasks in this project.");
    }
}
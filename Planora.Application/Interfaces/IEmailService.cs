namespace Planora.Application.Interfaces;

public interface IEmailService
{
    Task SendWorkspaceInvitationAsync(string toEmail, string workspaceName, string inviterName);
    Task SendProjectInvitationAsync(string toEmail, string toName, string projectName, string inviterName);
    Task SendTaskAssignedAsync(string toEmail, string toName, string taskTitle, string projectName);
}

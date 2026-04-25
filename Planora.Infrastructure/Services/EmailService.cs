using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Planora.Application.Interfaces;
using Planora.Infrastructure.Settings;

namespace Planora.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendWorkspaceInvitationAsync(string toEmail, string workspaceName, string inviterName)
    {
        var subject = $"You've been invited to join the workspace \"{workspaceName}\"";
        var body = $@"<html><body>
<p>Hello,</p>
<p><strong>{inviterName}</strong> has invited you to join the workspace <strong>{workspaceName}</strong> on Planora.</p>
<p>Log in to your Planora account to view and accept the invitation.</p>
<p>The invitation will expire in 7 days.</p>
<br/>
<p>The Planora Team</p>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendProjectInvitationAsync(string toEmail, string toName, string projectName, string inviterName)
    {
        var subject = $"You've been invited to join the project \"{projectName}\"";
        var body = $@"<html><body>
<p>Hello {toName},</p>
<p><strong>{inviterName}</strong> has invited you to join the project <strong>{projectName}</strong> on Planora.</p>
<p>Log in to your Planora account to view and accept the invitation.</p>
<p>The invitation will expire in 7 days.</p>
<br/>
<p>The Planora Team</p>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendTaskAssignedAsync(string toEmail, string toName, string taskTitle, string projectName)
    {
        var subject = $"You have been assigned to a task in \"{projectName}\"";
        var body = $@"<html><body>
<p>Hello {toName},</p>
<p>You have been assigned to the task <strong>{taskTitle}</strong> in the project <strong>{projectName}</strong> on Planora.</p>
<p>Log in to your Planora account to view the task details.</p>
<br/>
<p>The Planora Team</p>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            _logger.LogWarning("Email not sent to {ToEmail}: SMTP host is not configured.", toEmail);
            return;
        }

        try
        {
            using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                EnableSsl = _settings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_settings.Username, _settings.Password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {ToEmail} with subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject: {Subject}", toEmail, subject);
        }
    }
}

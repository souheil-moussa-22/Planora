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
        var subject = $"You've been invited to join the workspace \"{WebUtility.HtmlEncode(workspaceName)}\"";
        var body = $@"<html><body>
<p>Hello,</p>
<p><strong>{WebUtility.HtmlEncode(inviterName)}</strong> has invited you to join the workspace <strong>{WebUtility.HtmlEncode(workspaceName)}</strong> on Planora.</p>
<p>Log in to your Planora account to view and accept the invitation.</p>
<p>The invitation will expire in 7 days.</p>
<br/>
<p>The Planora Team</p>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendProjectInvitationAsync(string toEmail, string toName, string projectName, string inviterName)
    {
        var subject = $"You've been invited to join the project \"{WebUtility.HtmlEncode(projectName)}\"";
        var body = $@"<html><body>
<p>Hello {WebUtility.HtmlEncode(toName)},</p>
<p><strong>{WebUtility.HtmlEncode(inviterName)}</strong> has invited you to join the project <strong>{WebUtility.HtmlEncode(projectName)}</strong> on Planora.</p>
<p>Log in to your Planora account to view and accept the invitation.</p>
<p>The invitation will expire in 7 days.</p>
<br/>
<p>The Planora Team</p>
</body></html>";

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendTaskAssignedAsync(string toEmail, string toName, string taskTitle, string projectName)
    {
        var subject = $"You have been assigned to a task in \"{WebUtility.HtmlEncode(projectName)}\"";
        var body = $@"<html><body>
<p>Hello {WebUtility.HtmlEncode(toName)},</p>
<p>You have been assigned to the task <strong>{WebUtility.HtmlEncode(taskTitle)}</strong> in the project <strong>{WebUtility.HtmlEncode(projectName)}</strong> on Planora.</p>
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
            _logger.LogWarning("Email not sent: SMTP host is not configured.");
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
            _logger.LogInformation("Email sent successfully with subject: {Subject}", subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email with subject: {Subject}", subject);
        }
    }
}

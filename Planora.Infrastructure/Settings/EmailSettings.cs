namespace Planora.Infrastructure.Settings;

public class EmailSettings
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public string SenderEmail { get; set; } = "planora@gmail.com";
    public string SenderName { get; set; } = "Planora";
    public string Username { get; set; } = "planora@gmail.com";
    public string Password { get; set; } = "sbmclnnwuvlyppgt";
    public bool EnableSsl { get; set; } = true;
}

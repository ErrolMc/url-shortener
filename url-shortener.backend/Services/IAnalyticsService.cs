using url_shortener.backend.Models;

namespace url_shortener.backend.Services;

public interface IAnalyticsService
{
    Task RecordClickAsync(string shortCode, string? ipAddress, string? userAgent, string? referrer);
    Task<IEnumerable<AnalyticEvent>> GetClicksAsync(string shortCode);
}

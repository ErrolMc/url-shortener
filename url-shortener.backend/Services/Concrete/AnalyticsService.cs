using url_shortener.backend.Models;
using url_shortener.backend.Repositories;

namespace url_shortener.backend.Services.Concrete;

public class AnalyticsService : IAnalyticsService
{
    private readonly IAnalyticsRepository _analytics;

    public AnalyticsService(IAnalyticsRepository analytics)
    {
        _analytics = analytics;
    }

    public async Task RecordClickAsync(string shortCode, string? ipAddress, string? userAgent, string? referrer)
    {
        var evt = new AnalyticEvent
        {
            Id = Guid.NewGuid().ToString(),
            ShortCode = shortCode,
            Timestamp = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Referrer = referrer,
        };

        await _analytics.RecordAsync(evt);
    }

    public Task<IEnumerable<AnalyticEvent>> GetClicksAsync(string shortCode)
        => _analytics.GetByShortCodeAsync(shortCode);
}

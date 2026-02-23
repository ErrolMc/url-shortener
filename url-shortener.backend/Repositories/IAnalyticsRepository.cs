using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories;

public interface IAnalyticsRepository
{
    Task RecordAsync(AnalyticEvent evt);
    Task<IEnumerable<AnalyticEvent>> GetByShortCodeAsync(string shortCode);
    Task DeleteByShortCodeAsync(string shortCode);
}

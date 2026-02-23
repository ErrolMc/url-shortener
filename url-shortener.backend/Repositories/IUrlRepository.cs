using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories;

public interface IUrlRepository
{
    Task<IEnumerable<ShortenedUrl>> GetByUserAsync(string userId);
    Task<ShortenedUrl> CreateAsync(ShortenedUrl url);
    Task<ShortenedUrl> DeleteAsync(string id, string userId);
    Task<ShortenedUrl?> GetByShortCodeAsync(string shortCode);
}

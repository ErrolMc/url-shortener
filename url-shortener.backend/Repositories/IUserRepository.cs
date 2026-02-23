using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories;

public interface IUserRepository
{
    Task<AppUser> UpsertAsync(string googleId, string email, string? name, string? picture);
}

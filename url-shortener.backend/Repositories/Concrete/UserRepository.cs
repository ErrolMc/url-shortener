using Microsoft.Azure.Cosmos;
using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories.Concrete;

public class UserRepository : IUserRepository
{
    private readonly Task<Container> _containerTask;

    public UserRepository(CosmosClient client)
    {
        _containerTask = InitializeAsync(client);
    }

    private static async Task<Container> InitializeAsync(CosmosClient client)
    {
        var db = await client.CreateDatabaseIfNotExistsAsync("urlshortener");
        var container = await db.Database.CreateContainerIfNotExistsAsync(
            new ContainerProperties("users", "/id"));
        return container.Container;
    }

    public async Task<AppUser> UpsertAsync(string googleId, string email, string? name, string? picture)
    {
        var container = await _containerTask;
        var id = $"user_{googleId}";

        try
        {
            var response = await container.ReadItemAsync<AppUser>(id, new PartitionKey(id));
            var user = response.Resource;
            user.Email = email;
            user.Name = name;
            user.Picture = picture;
            user.UpdatedAt = DateTime.UtcNow;
            await container.ReplaceItemAsync(user, id, new PartitionKey(id));
            return user;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            var user = new AppUser
            {
                Id = id,
                GoogleId = googleId,
                Email = email,
                Name = name,
                Picture = picture,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await container.CreateItemAsync(user, new PartitionKey(id));
            return user;
        }
    }
}

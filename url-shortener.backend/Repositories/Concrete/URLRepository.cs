using Microsoft.Azure.Cosmos;
using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories.Concrete;

public class UrlRepository : IUrlRepository
{
    private readonly Task<Container> _containerTask;

    public UrlRepository(CosmosClient client)
    {
        _containerTask = InitializeAsync(client);
    }

    private static async Task<Container> InitializeAsync(CosmosClient client)
    {
        var db = await client.CreateDatabaseIfNotExistsAsync("urlshortener");
        var container = await db.Database.CreateContainerIfNotExistsAsync(
            new ContainerProperties("urls", "/userId"));
        return container.Container;
    }

    public async Task<IEnumerable<ShortenedUrl>> GetByUserAsync(string userId)
    {
        var container = await _containerTask;
        var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC")
            .WithParameter("@userId", userId);

        var results = new List<ShortenedUrl>();
        using var feed = container.GetItemQueryIterator<ShortenedUrl>(query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            results.AddRange(batch);
        }

        return results;
    }

    public async Task<ShortenedUrl> CreateAsync(ShortenedUrl url)
    {
        var container = await _containerTask;
        var response = await container.CreateItemAsync(url, new PartitionKey(url.UserId));
        return response.Resource;
    }

    public async Task<ShortenedUrl> DeleteAsync(string id, string userId)
    {
        var container = await _containerTask;
        var pk = new PartitionKey(userId);
        var read = await container.ReadItemAsync<ShortenedUrl>(id, pk);
        await container.DeleteItemAsync<ShortenedUrl>(id, pk);
        return read.Resource;
    }

    public async Task<ShortenedUrl?> GetByShortCodeAsync(string shortCode)
    {
        var container = await _containerTask;
        var query = new QueryDefinition("SELECT * FROM c WHERE c.shortCode = @shortCode")
            .WithParameter("@shortCode", shortCode);

        using var feed = container.GetItemQueryIterator<ShortenedUrl>(query);
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            var result = batch.FirstOrDefault();
            if (result != null) return result;
        }

        return null;
    }
}

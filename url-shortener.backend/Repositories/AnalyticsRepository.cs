using Microsoft.Azure.Cosmos;
using url_shortener.backend.Models;

namespace url_shortener.backend.Repositories;

public interface IAnalyticsRepository
{
    Task RecordAsync(AnalyticEvent evt);
    Task<IEnumerable<AnalyticEvent>> GetByShortCodeAsync(string shortCode);
}

public class AnalyticsRepository : IAnalyticsRepository
{
    private readonly Task<Container> _containerTask;

    public AnalyticsRepository(CosmosClient client)
    {
        _containerTask = InitializeAsync(client);
    }

    private static async Task<Container> InitializeAsync(CosmosClient client)
    {
        var db = await client.CreateDatabaseIfNotExistsAsync("urlshortener");
        var container = await db.Database.CreateContainerIfNotExistsAsync(
            new ContainerProperties("analytics", "/shortCode"));
        return container.Container;
    }

    public async Task RecordAsync(AnalyticEvent evt)
    {
        var container = await _containerTask;
        await container.CreateItemAsync(evt, new PartitionKey(evt.ShortCode));
    }

    public async Task<IEnumerable<AnalyticEvent>> GetByShortCodeAsync(string shortCode)
    {
        var container = await _containerTask;
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.shortCode = @shortCode ORDER BY c.timestamp DESC")
            .WithParameter("@shortCode", shortCode);

        var results = new List<AnalyticEvent>();
        using var feed = container.GetItemQueryIterator<AnalyticEvent>(query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(shortCode) });

        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            results.AddRange(batch);
        }

        return results;
    }
}

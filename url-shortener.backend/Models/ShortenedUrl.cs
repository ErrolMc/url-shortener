using Newtonsoft.Json;

namespace url_shortener.backend.Models;

public class ShortenedUrl
{
    [JsonProperty("id")]
    public string Id { get; set; } = default!;

    [JsonProperty("userId")]
    public string UserId { get; set; } = default!;

    [JsonProperty("originalUrl")]
    public string OriginalUrl { get; set; } = default!;

    [JsonProperty("shortCode")]
    public string ShortCode { get; set; } = default!;

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("clickCount")]
    public long ClickCount { get; set; }
}

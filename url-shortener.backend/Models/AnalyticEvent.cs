using Newtonsoft.Json;

namespace url_shortener.backend.Models;

public class AnalyticEvent
{
    [JsonProperty("id")]
    public string Id { get; set; } = default!;

    [JsonProperty("shortCode")]
    public string ShortCode { get; set; } = default!;

    [JsonProperty("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonProperty("ipAddress")]
    public string? IpAddress { get; set; }

    [JsonProperty("userAgent")]
    public string? UserAgent { get; set; }

    [JsonProperty("referrer")]
    public string? Referrer { get; set; }
}

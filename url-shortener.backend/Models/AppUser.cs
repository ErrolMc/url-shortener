using Newtonsoft.Json;

namespace url_shortener.backend.Models;

public class AppUser
{
    [JsonProperty("id")]
    public string Id { get; set; } = default!;

    [JsonProperty("googleId")]
    public string GoogleId { get; set; } = default!;

    [JsonProperty("email")]
    public string Email { get; set; } = default!;

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("picture")]
    public string? Picture { get; set; }

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

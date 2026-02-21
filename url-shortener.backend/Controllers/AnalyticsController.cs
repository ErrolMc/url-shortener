using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using url_shortener.backend.Repositories;
using url_shortener.backend.Services;

namespace url_shortener.backend.Controllers;

[ApiController]
[Route("analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analytics;
    private readonly IUrlRepository _urls;

    public AnalyticsController(IAnalyticsService analytics, IUrlRepository urls)
    {
        _analytics = analytics;
        _urls = urls;
    }

    [HttpGet("{shortCode}")]
    public async Task<IActionResult> GetClicks(string shortCode)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        var url = await _urls.GetByShortCodeAsync(shortCode);
        if (url is null) return NotFound();
        if (url.UserId != userId) return Forbid();

        var events = await _analytics.GetClicksAsync(shortCode);
        return Ok(events);
    }
}

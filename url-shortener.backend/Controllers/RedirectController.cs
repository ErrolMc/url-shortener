using Microsoft.AspNetCore.Mvc;
using url_shortener.backend.Repositories;
using url_shortener.backend.Services;

namespace url_shortener.backend.Controllers;

[ApiController]
[Route("{shortCode}")]
public class RedirectController : ControllerBase
{
    private readonly IUrlRepository _urls;
    private readonly IAnalyticsService _analytics;

    public RedirectController(IUrlRepository urls, IAnalyticsService analytics)
    {
        _urls = urls;
        _analytics = analytics;
    }

    [HttpGet]
    public async Task<IActionResult> RedirectToUrl(string shortCode)
    {
        var url = await _urls.GetByShortCodeAsync(shortCode);
        if (url is null) return NotFound();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();
        var referrer = Request.Headers.Referer.ToString();

        await _analytics.RecordClickAsync(
            shortCode,
            string.IsNullOrEmpty(ip) ? null : ip,
            string.IsNullOrEmpty(userAgent) ? null : userAgent,
            string.IsNullOrEmpty(referrer) ? null : referrer);

        return Redirect(url.OriginalUrl);
    }
}

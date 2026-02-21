using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using url_shortener.backend.Models;
using url_shortener.backend.Repositories;
using url_shortener.backend.Services;

namespace url_shortener.backend.Controllers;

[ApiController]
[Route("urls")]
[Authorize]
public class URLController : ControllerBase
{
    const int MAX_CREATE_ATTEMPTS = 5;

    private readonly IUrlRepository _urls;
    private readonly ICodeGenerationService _codeGen;

    public URLController(IUrlRepository urls, ICodeGenerationService codeGen)
    {
        _urls = urls;
        _codeGen = codeGen;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        var urls = await _urls.GetByUserAsync(userId);
        return Ok(urls);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUrlRequest req)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        string shortCode;
        if (string.IsNullOrWhiteSpace(req.CustomAlias))
        {
            // Auto-generate, retrying on collision
            string candidate;
            int attempts = 0;
            do
            {
                candidate = _codeGen.Generate();
                if (++attempts > MAX_CREATE_ATTEMPTS) 
                    return Conflict("Could not generate a unique short code. Please try again.");
            }
            while (await _urls.GetByShortCodeAsync(candidate) is not null);
            shortCode = candidate;
        }
        else
        {
            shortCode = req.CustomAlias.Trim();
            if (await _urls.GetByShortCodeAsync(shortCode) is not null)
                return Conflict($"The alias '{shortCode}' is already taken.");
        }

        var url = new ShortenedUrl
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            OriginalUrl = req.OriginalUrl,
            ShortCode = shortCode,
            CreatedAt = DateTime.UtcNow,
            ClickCount = 0,
        };

        var created = await _urls.CreateAsync(url);
        return Ok(created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null) return Unauthorized();

        await _urls.DeleteAsync(id, userId);
        return NoContent();
    }
}

public record CreateUrlRequest(string OriginalUrl, string? CustomAlias);

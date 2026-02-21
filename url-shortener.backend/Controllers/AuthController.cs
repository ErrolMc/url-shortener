using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using url_shortener.backend.Repositories;

namespace url_shortener.backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly IConfiguration _config;

    public AuthController(IUserRepository users, IConfiguration config)
    {
        _users = users;
        _config = config;
    }

    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleSignInRequest req)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_config["Google:ClientId"] ?? ""]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken, settings);
        }
        catch
        {
            return Unauthorized();
        }

        var user = await _users.UpsertAsync(payload.Subject, payload.Email, payload.Name, payload.Picture);

        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "url-shortener-backend",
            audience: _config["Jwt:Audience"] ?? "url-shortener-frontend",
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("googleId", user.GoogleId),
            ],
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
    }
}

public record GoogleSignInRequest(string IdToken);

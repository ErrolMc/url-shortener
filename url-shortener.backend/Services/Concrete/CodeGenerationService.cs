using url_shortener.backend.Services;

namespace url_shortener.backend.Services.Concrete;

public class CodeGenerationService : ICodeGenerationService
{
    private const string Chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    private readonly Random _random = new();

    public string Generate()
    {
        return new string(Enumerable.Repeat(Chars, 6)
            .Select(s => s[_random.Next(s.Length)])
            .ToArray());
    }
}

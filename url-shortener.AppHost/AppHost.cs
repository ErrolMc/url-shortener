var builder = DistributedApplication.CreateBuilder(args);

var cosmos = builder.AddAzureCosmosDB("cosmos")
    .RunAsEmulator(emulator => emulator
        .WithLifetime(ContainerLifetime.Persistent)
        .WithDataVolume("chatapp-cosmos-data"));

var googleClientId = builder.Configuration["Google:ClientId"] ?? "";
var googleClientSecret = builder.Configuration["Google:ClientSecret"] ?? "";
var nextAuthSecret = builder.Configuration["NextAuth:Secret"] ?? "";
var nextAuthUrl = builder.Configuration["NextAuth:Url"] ?? "http://localhost:3000";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";
var extraCorsOrigins = builder.Configuration["Cors:ExtraOrigins"] ?? "";
var urlDomain = builder.Configuration["UrlDomain"] ?? "";

var backend = builder.AddProject<Projects.url_shortener_backend>("url-shortener-backend")
    .WithReference(cosmos)
    .WaitFor(cosmos)
    .WithExternalHttpEndpoints()
    .WithEnvironment("Google__ClientId", googleClientId)
    .WithEnvironment("Jwt__Secret", jwtSecret)
    .WithEnvironment("Jwt__Issuer", "url-shortener-backend")
    .WithEnvironment("Jwt__Audience", "url-shortener-frontend");

var frontend = builder.AddJavaScriptApp("frontend", "../url-shortner.frontend", "dev")
    .WithHttpEndpoint(env: "PORT", port: 3000)
    .WithExternalHttpEndpoints()
    .WithReference(backend)
    .WaitFor(backend)
    .WithEnvironment("GOOGLE_CLIENT_ID", googleClientId)
    .WithEnvironment("GOOGLE_CLIENT_SECRET", googleClientSecret)
    .WithEnvironment("NEXTAUTH_SECRET", nextAuthSecret)
    .WithEnvironment("NEXTAUTH_URL", nextAuthUrl)
    .WithEnvironment("NEXT_PUBLIC_BACKEND_URL", backend.GetEndpoint("http"))
    .WithEnvironment("NEXT_PUBLIC_URL_DOMAIN", string.IsNullOrEmpty(urlDomain)
        ? ReferenceExpression.Create($"{backend.GetEndpoint("http")}")
        : ReferenceExpression.Create($"{urlDomain}"));

var corsOrigins = string.IsNullOrEmpty(extraCorsOrigins)
    ? ReferenceExpression.Create($"{frontend.GetEndpoint("http")}")
    : ReferenceExpression.Create($"{frontend.GetEndpoint("http")},{extraCorsOrigins}");

backend.WithEnvironment("CORS_ORIGINS", corsOrigins);

builder.Build().Run();

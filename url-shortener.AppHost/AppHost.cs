var builder = DistributedApplication.CreateBuilder(args);

var cosmos = builder.AddAzureCosmosDB("cosmos")
    .RunAsEmulator();

var googleClientId = builder.Configuration["Google:ClientId"] ?? "";
var googleClientSecret = builder.Configuration["Google:ClientSecret"] ?? "";
var nextAuthSecret = builder.Configuration["NextAuth:Secret"] ?? "";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";

var backend = builder.AddProject<Projects.url_shortener_backend>("url-shortener-backend")
    .WithReference(cosmos)
    .WaitFor(cosmos)
    .WithEnvironment("Google__ClientId", googleClientId)
    .WithEnvironment("Jwt__Secret", jwtSecret)
    .WithEnvironment("Jwt__Issuer", "url-shortener-backend")
    .WithEnvironment("Jwt__Audience", "url-shortener-frontend");

var frontend = builder.AddDockerfile("frontend", "../url-shortner.frontend")
    .WithReference(backend)
    .WaitFor(backend)
    .WithHttpEndpoint(targetPort: 3000, port: 3000)
    .WithExternalHttpEndpoints()
    .WithEnvironment("GOOGLE_CLIENT_ID", googleClientId)
    .WithEnvironment("GOOGLE_CLIENT_SECRET", googleClientSecret)
    .WithEnvironment("NEXTAUTH_SECRET", nextAuthSecret)
    .WithEnvironment("NEXTAUTH_URL", "http://localhost:3000");

backend.WithEnvironment("CORS_ORIGINS", frontend.GetEndpoint("http"));

builder.Build().Run();

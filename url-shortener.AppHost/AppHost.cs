var builder = DistributedApplication.CreateBuilder(args);

var backend = builder.AddProject<Projects.url_shortener_backend>("url-shortener-backend");

var frontend = builder.AddDockerfile("frontend", "../url-shortner.frontend")
    .WithReference(backend)
    .WaitFor(backend)
    .WithHttpEndpoint(targetPort: 3000)
    .WithExternalHttpEndpoints();

backend.WithEnvironment("CORS_ORIGINS", frontend.GetEndpoint("http"));

builder.Build().Run();

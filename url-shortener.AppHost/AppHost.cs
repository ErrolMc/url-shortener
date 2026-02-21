var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.url_shortener_backend>("url-shortener-backend");

builder.Build().Run();

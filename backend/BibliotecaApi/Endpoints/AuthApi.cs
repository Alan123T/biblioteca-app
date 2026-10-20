namespace BibliotecaApi.Endpoints;

using System.Security.Claims;
using BibliotecaApi.Data;
using BibliotecaApi.Models;
using BibliotecaApi.Services;
using Microsoft.EntityFrameworkCore;

public static class AuthApi
{
    public record RegistroRequest(string? NombreUsuario, string? Password);
    public record LoginRequest(string? NombreUsuario, string? Password);

    public static RouteGroupBuilder MapAuthApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        // POST /api/auth/registro
        group.MapPost("/registro", async (RegistroRequest req, BibliotecaDbContext db, IAuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(req.NombreUsuario) || req.NombreUsuario.Trim().Length < 3 || req.NombreUsuario.Trim().Length > 50)
            {
                return Results.BadRequest(new { mensaje = "El nombre de usuario debe tener entre 3 y 50 caracteres." });
            }

            if (string.IsNullOrEmpty(req.Password) || req.Password.Length < 8)
            {
                return Results.BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres." });
            }

            var nombreUsuario = req.NombreUsuario.Trim();
            var existe = await db.Usuarios.AnyAsync(u => u.NombreUsuario == nombreUsuario);
            if (existe)
            {
                return Results.Conflict(new { mensaje = "El nombre de usuario ya está registrado." });
            }

            var usuario = new Usuario
            {
                NombreUsuario = nombreUsuario,
                Rol = "Lector" // Siempre crea el usuario con rol "Lector", ignorando cualquier otro enviado
            };
            usuario.PasswordHash = authService.HashPassword(usuario, req.Password);

            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();

            return Results.Json(
                new { idUsuario = usuario.IdUsuario, nombreUsuario = usuario.NombreUsuario },
                statusCode: StatusCodes.Status201Created
            );
        })
        .RequireRateLimiting("AuthRateLimit");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest req, BibliotecaDbContext db, IAuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(req.NombreUsuario) || string.IsNullOrEmpty(req.Password))
            {
                return Results.Json(new { mensaje = "Credenciales inválidas" }, statusCode: StatusCodes.Status401Unauthorized);
            }

            var nombreUsuario = req.NombreUsuario.Trim();
            var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario);
            if (usuario is null || !authService.VerificarPassword(usuario, req.Password))
            {
                return Results.Json(new { mensaje = "Credenciales inválidas" }, statusCode: StatusCodes.Status401Unauthorized);
            }

            var (token, expiracion) = authService.GenerarToken(usuario);
            return Results.Ok(new
            {
                token,
                rol = usuario.Rol,
                expiracion
            });
        })
        .RequireRateLimiting("AuthRateLimit");

        // GET /api/auth/yo
        group.MapGet("/yo", (ClaimsPrincipal user) =>
        {
            var nombre = user.FindFirst(ClaimTypes.Name)?.Value
                         ?? user.FindFirst("nombre")?.Value
                         ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? user.Identity?.Name
                         ?? string.Empty;

            var rol = user.FindFirst(ClaimTypes.Role)?.Value
                      ?? user.FindFirst("rol")?.Value
                      ?? user.FindFirst("role")?.Value
                      ?? string.Empty;

            return Results.Ok(new { nombre, rol });
        })
        .RequireAuthorization();

        return group;
    }
}

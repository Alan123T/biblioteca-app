namespace BibliotecaApi.Services;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BibliotecaApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

public interface IAuthService
{
    string HashPassword(Usuario usuario, string password);
    bool VerificarPassword(Usuario usuario, string password);
    (string Token, DateTime Expiracion) GenerarToken(Usuario usuario);
}

public class AuthService : IAuthService
{
    private readonly PasswordHasher<Usuario> _passwordHasher = new();
    private readonly IConfiguration _configuration;

    public AuthService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string HashPassword(Usuario usuario, string password)
    {
        return _passwordHasher.HashPassword(usuario, password);
    }

    public bool VerificarPassword(Usuario usuario, string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, password);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }

    public (string Token, DateTime Expiracion) GenerarToken(Usuario usuario)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("La clave JWT no está configurada en user-secrets.");
        var issuer = _configuration["Jwt:Issuer"] ?? "BibliotecaApi";
        var audience = _configuration["Jwt:Audience"] ?? "BibliotecaApiUsuarios";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var expiracion = DateTime.UtcNow.AddMinutes(60);

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, usuario.NombreUsuario),
            new(ClaimTypes.Role, usuario.Rol),
            new(JwtRegisteredClaimNames.Sub, usuario.NombreUsuario),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("rol", usuario.Rol),
            new("nombre", usuario.NombreUsuario)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiracion,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return (tokenString, expiracion);
    }
}

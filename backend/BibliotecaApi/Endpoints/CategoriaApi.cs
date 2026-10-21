namespace BibliotecaApi.Endpoints;

using BibliotecaApi.Data;
using BibliotecaApi.DTOs;
using BibliotecaApi.Models;
using Microsoft.EntityFrameworkCore;

public static class CategoriaApi
{
    public static RouteGroupBuilder MapCategoriaApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categorias");

        // GET /api/categorias (autenticado, cualquier rol)
        group.MapGet("/", async (BibliotecaDbContext db) =>
        {
            var categorias = await db.Categorias
                .AsNoTracking()
                .OrderBy(c => c.Nombre)
                .Select(c => new CategoriaResponseDto(c.IdCategoria, c.Nombre))
                .ToListAsync();

            return Results.Ok(categorias);
        })
        .RequireAuthorization();

        // GET /api/categorias/{id} (autenticado, cualquier rol)
        group.MapGet("/{id:int}", async (int id, BibliotecaDbContext db) =>
        {
            var categoria = await db.Categorias
                .AsNoTracking()
                .Where(c => c.IdCategoria == id)
                .Select(c => new CategoriaResponseDto(c.IdCategoria, c.Nombre))
                .FirstOrDefaultAsync();

            if (categoria is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró la categoría con ID {id}." });
            }

            return Results.Ok(categoria);
        })
        .RequireAuthorization();

        // POST /api/categorias (solo "admin")
        group.MapPost("/", async (CategoriaCreateDto dto, BibliotecaDbContext db) =>
        {
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                errors["Nombre"] = ["El nombre de la categoría es requerido."];
            }
            else if (dto.Nombre.Trim().Length > 80)
            {
                errors["Nombre"] = ["El nombre de la categoría no puede superar los 80 caracteres."];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var nombre = dto.Nombre!.Trim();
            var existe = await db.Categorias.AnyAsync(c => c.Nombre == nombre);
            if (existe)
            {
                return Results.Conflict(new { mensaje = "Ya existe una categoría con ese nombre." });
            }

            var categoria = new Categoria
            {
                Nombre = nombre
            };

            db.Categorias.Add(categoria);
            await db.SaveChangesAsync();

            var responseDto = new CategoriaResponseDto(categoria.IdCategoria, categoria.Nombre);
            return Results.Created($"/api/categorias/{categoria.IdCategoria}", responseDto);
        })
        .RequireAuthorization("AdminOnly");

        // PUT /api/categorias/{id} (solo "admin")
        group.MapPut("/{id:int}", async (int id, CategoriaUpdateDto dto, BibliotecaDbContext db) =>
        {
            var categoria = await db.Categorias.FindAsync(id);
            if (categoria is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró la categoría con ID {id}." });
            }

            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                errors["Nombre"] = ["El nombre de la categoría es requerido."];
            }
            else if (dto.Nombre.Trim().Length > 80)
            {
                errors["Nombre"] = ["El nombre de la categoría no puede superar los 80 caracteres."];
            }

            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var nombre = dto.Nombre!.Trim();
            var existe = await db.Categorias.AnyAsync(c => c.Nombre == nombre && c.IdCategoria != id);
            if (existe)
            {
                return Results.Conflict(new { mensaje = "Ya existe otra categoría con ese nombre." });
            }

            categoria.Nombre = nombre;
            await db.SaveChangesAsync();

            return Results.Ok(new CategoriaResponseDto(categoria.IdCategoria, categoria.Nombre));
        })
        .RequireAuthorization("AdminOnly");

        // DELETE /api/categorias/{id} (solo "admin")
        group.MapDelete("/{id:int}", async (int id, BibliotecaDbContext db) =>
        {
            var categoria = await db.Categorias.FindAsync(id);
            if (categoria is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró la categoría con ID {id}." });
            }

            var tieneLibros = await db.Libros.AnyAsync(l => l.IdCategoria == id);
            if (tieneLibros)
            {
                return Results.Conflict(new { mensaje = "No se puede eliminar la categoría porque tiene libros asociados." });
            }

            db.Categorias.Remove(categoria);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization("AdminOnly");

        return group;
    }
}

namespace BibliotecaApi.Endpoints;

using BibliotecaApi.Data;
using BibliotecaApi.DTOs;
using BibliotecaApi.Models;
using Microsoft.EntityFrameworkCore;

public static class LibroApi
{
    public static RouteGroupBuilder MapLibroApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/libros");

        // GET /api/libros (autenticado, cualquier rol)
        group.MapGet("/", async (
            int? page,
            int? pageSize,
            string? q,
            int? idCategoria,
            BibliotecaDbContext db) =>
        {
            var currentPage = page.GetValueOrDefault(1);
            if (currentPage <= 0) currentPage = 1;

            var currentPageSize = pageSize.GetValueOrDefault(10);
            if (currentPageSize <= 0) currentPageSize = 10;
            if (currentPageSize > 50) currentPageSize = 50;

            var query = db.Libros.AsNoTracking().Include(l => l.Categoria).AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(l => l.Titulo.Contains(term) || l.Autor.Contains(term));
            }

            if (idCategoria.HasValue)
            {
                query = query.Where(l => l.IdCategoria == idCategoria.Value);
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderBy(l => l.Titulo)
                .Skip((currentPage - 1) * currentPageSize)
                .Take(currentPageSize)
                .Select(l => new LibroResponseDto(
                    l.IdLibro,
                    l.Titulo,
                    l.Autor,
                    l.Isbn,
                    l.Anio,
                    l.Stock,
                    l.IdCategoria,
                    l.Categoria != null ? l.Categoria.Nombre : string.Empty
                ))
                .ToListAsync();

            var result = new PaginatedListDto<LibroResponseDto>(items, total, currentPage, currentPageSize);
            return Results.Ok(result);
        })
        .RequireAuthorization();

        // GET /api/libros/{id} (autenticado, cualquier rol)
        group.MapGet("/{id:int}", async (int id, BibliotecaDbContext db) =>
        {
            var libro = await db.Libros
                .AsNoTracking()
                .Include(l => l.Categoria)
                .Where(l => l.IdLibro == id)
                .Select(l => new LibroResponseDto(
                    l.IdLibro,
                    l.Titulo,
                    l.Autor,
                    l.Isbn,
                    l.Anio,
                    l.Stock,
                    l.IdCategoria,
                    l.Categoria != null ? l.Categoria.Nombre : string.Empty
                ))
                .FirstOrDefaultAsync();

            if (libro is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró el libro con ID {id}." });
            }

            return Results.Ok(libro);
        })
        .RequireAuthorization();

        // POST /api/libros (solo "admin")
        group.MapPost("/", async (LibroCreateDto dto, BibliotecaDbContext db) =>
        {
            var errors = await ValidarLibroAsync(dto.Titulo, dto.Autor, dto.Isbn, dto.Anio, dto.Stock, dto.IdCategoria, db);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            var categoria = await db.Categorias.FindAsync(dto.IdCategoria);

            var libro = new Libro
            {
                Titulo = dto.Titulo!.Trim(),
                Autor = dto.Autor!.Trim(),
                Isbn = string.IsNullOrWhiteSpace(dto.Isbn) ? null : dto.Isbn.Trim(),
                Anio = dto.Anio,
                Stock = dto.Stock,
                IdCategoria = dto.IdCategoria
            };

            db.Libros.Add(libro);
            await db.SaveChangesAsync();

            var responseDto = new LibroResponseDto(
                libro.IdLibro,
                libro.Titulo,
                libro.Autor,
                libro.Isbn,
                libro.Anio,
                libro.Stock,
                libro.IdCategoria,
                categoria?.Nombre ?? string.Empty
            );

            return Results.Created($"/api/libros/{libro.IdLibro}", responseDto);
        })
        .RequireAuthorization("AdminOnly");

        // PUT /api/libros/{id} (solo "admin")
        group.MapPut("/{id:int}", async (int id, LibroUpdateDto dto, BibliotecaDbContext db) =>
        {
            var libro = await db.Libros.FindAsync(id);
            if (libro is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró el libro con ID {id}." });
            }

            var errors = await ValidarLibroAsync(dto.Titulo, dto.Autor, dto.Isbn, dto.Anio, dto.Stock, dto.IdCategoria, db);
            if (errors.Count > 0)
            {
                return Results.ValidationProblem(errors);
            }

            libro.Titulo = dto.Titulo!.Trim();
            libro.Autor = dto.Autor!.Trim();
            libro.Isbn = string.IsNullOrWhiteSpace(dto.Isbn) ? null : dto.Isbn.Trim();
            libro.Anio = dto.Anio;
            libro.Stock = dto.Stock;
            libro.IdCategoria = dto.IdCategoria;

            await db.SaveChangesAsync();

            var categoria = await db.Categorias.FindAsync(dto.IdCategoria);
            var responseDto = new LibroResponseDto(
                libro.IdLibro,
                libro.Titulo,
                libro.Autor,
                libro.Isbn,
                libro.Anio,
                libro.Stock,
                libro.IdCategoria,
                categoria?.Nombre ?? string.Empty
            );

            return Results.Ok(responseDto);
        })
        .RequireAuthorization("AdminOnly");

        // DELETE /api/libros/{id} (solo "admin")
        group.MapDelete("/{id:int}", async (int id, BibliotecaDbContext db) =>
        {
            var libro = await db.Libros.FindAsync(id);
            if (libro is null)
            {
                return Results.NotFound(new { mensaje = $"No se encontró el libro con ID {id}." });
            }

            db.Libros.Remove(libro);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization("AdminOnly");

        return group;
    }

    private static async Task<Dictionary<string, string[]>> ValidarLibroAsync(
        string? titulo,
        string? autor,
        string? isbn,
        int anio,
        int stock,
        int idCategoria,
        BibliotecaDbContext db)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(titulo))
        {
            errors["Titulo"] = ["El título es requerido."];
        }
        else if (titulo.Trim().Length > 150)
        {
            errors["Titulo"] = ["El título no puede superar los 150 caracteres."];
        }

        if (string.IsNullOrWhiteSpace(autor))
        {
            errors["Autor"] = ["El autor es requerido."];
        }
        else if (autor.Trim().Length > 120)
        {
            errors["Autor"] = ["El autor no puede superar los 120 caracteres."];
        }

        if (!string.IsNullOrEmpty(isbn) && isbn.Trim().Length > 20)
        {
            errors["Isbn"] = ["El ISBN no puede superar los 20 caracteres."];
        }

        var currentYear = DateTime.UtcNow.Year;
        if (anio < 1 || anio > currentYear)
        {
            errors["Anio"] = [$"El año debe estar entre 1 y {currentYear}."];
        }

        if (stock < 0)
        {
            errors["Stock"] = ["El stock debe ser mayor o igual a 0."];
        }

        var categoriaExiste = await db.Categorias.AnyAsync(c => c.IdCategoria == idCategoria);
        if (!categoriaExiste)
        {
            errors["IdCategoria"] = [$"La categoría con ID {idCategoria} no existe."];
        }

        return errors;
    }
}

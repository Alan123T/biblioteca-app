namespace BibliotecaApi.DTOs;

public record LibroResponseDto(
    int IdLibro,
    string Titulo,
    string Autor,
    string? Isbn,
    int Anio,
    int Stock,
    int IdCategoria,
    string Categoria
);

public record LibroCreateDto(
    string? Titulo,
    string? Autor,
    string? Isbn,
    int Anio,
    int Stock,
    int IdCategoria
);

public record LibroUpdateDto(
    string? Titulo,
    string? Autor,
    string? Isbn,
    int Anio,
    int Stock,
    int IdCategoria
);

public record PaginatedListDto<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize
);

namespace BibliotecaApi.DTOs;

public record CategoriaResponseDto(
    int IdCategoria,
    string Nombre
);

public record CategoriaCreateDto(
    string? Nombre
);

public record CategoriaUpdateDto(
    string? Nombre
);

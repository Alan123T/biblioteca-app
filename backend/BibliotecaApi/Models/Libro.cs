namespace BibliotecaApi.Models;

public class Libro
{
    public int IdLibro { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public string? Isbn { get; set; }
    public int Anio { get; set; }
    public int Stock { get; set; }
    public int IdCategoria { get; set; }

    public Categoria? Categoria { get; set; }
}

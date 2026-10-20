namespace BibliotecaApi.Models;

public class Categoria
{
    public int IdCategoria { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<Libro> Libros { get; set; } = new List<Libro>();
}

namespace BibliotecaApi.Data;

using BibliotecaApi.Models;
using Microsoft.EntityFrameworkCore;

public class BibliotecaDbContext : DbContext
{
    public BibliotecaDbContext(DbContextOptions<BibliotecaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Libro> Libros => Set<Libro>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Categoria
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categoria");
            entity.HasKey(c => c.IdCategoria);
            entity.Property(c => c.IdCategoria).HasColumnName("IdCategoria").ValueGeneratedOnAdd();
            entity.Property(c => c.Nombre).HasColumnName("Nombre").IsRequired().HasMaxLength(80);
            entity.HasIndex(c => c.Nombre).IsUnique();
        });

        // Libro
        modelBuilder.Entity<Libro>(entity =>
        {
            entity.ToTable("Libro", t =>
            {
                t.HasCheckConstraint("CK_Libro_Stock", "[Stock] >= 0");
            });
            entity.HasKey(l => l.IdLibro);
            entity.Property(l => l.IdLibro).HasColumnName("IdLibro").ValueGeneratedOnAdd();
            entity.Property(l => l.Titulo).HasColumnName("Titulo").IsRequired().HasMaxLength(150);
            entity.Property(l => l.Autor).HasColumnName("Autor").IsRequired().HasMaxLength(120);
            entity.Property(l => l.Isbn).HasColumnName("Isbn").HasMaxLength(20);
            entity.Property(l => l.Anio).HasColumnName("Anio").IsRequired();
            entity.Property(l => l.Stock).HasColumnName("Stock").IsRequired().HasDefaultValue(0);
            entity.Property(l => l.IdCategoria).HasColumnName("IdCategoria").IsRequired();

            entity.HasOne(l => l.Categoria)
                  .WithMany(c => c.Libros)
                  .HasForeignKey(l => l.IdCategoria)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");
            entity.HasKey(u => u.IdUsuario);
            entity.Property(u => u.IdUsuario).HasColumnName("IdUsuario").ValueGeneratedOnAdd();
            entity.Property(u => u.NombreUsuario).HasColumnName("NombreUsuario").IsRequired().HasMaxLength(50);
            entity.HasIndex(u => u.NombreUsuario).IsUnique();
            entity.Property(u => u.PasswordHash).HasColumnName("PasswordHash").IsRequired();
            entity.Property(u => u.Rol).HasColumnName("Rol").IsRequired().HasMaxLength(50).HasDefaultValue("Lector");
        });

        // Seed data: 4 Categorias
        modelBuilder.Entity<Categoria>().HasData(
            new Categoria { IdCategoria = 1, Nombre = "Ficción" },
            new Categoria { IdCategoria = 2, Nombre = "Ciencia y Tecnología" },
            new Categoria { IdCategoria = 3, Nombre = "Historia" },
            new Categoria { IdCategoria = 4, Nombre = "Filosofía" }
        );

        // Seed data: 8 Libros
        modelBuilder.Entity<Libro>().HasData(
            new Libro
            {
                IdLibro = 1,
                Titulo = "Cien años de soledad",
                Autor = "Gabriel García Márquez",
                Isbn = "9780307474728",
                Anio = 1967,
                Stock = 10,
                IdCategoria = 1
            },
            new Libro
            {
                IdLibro = 2,
                Titulo = "Don Quijote de la Mancha",
                Autor = "Miguel de Cervantes",
                Isbn = "9788424116286",
                Anio = 1605,
                Stock = 5,
                IdCategoria = 1
            },
            new Libro
            {
                IdLibro = 3,
                Titulo = "Breve historia del tiempo",
                Autor = "Stephen Hawking",
                Isbn = "9788497593793",
                Anio = 1988,
                Stock = 7,
                IdCategoria = 2
            },
            new Libro
            {
                IdLibro = 4,
                Titulo = "El código limpio",
                Autor = "Robert C. Martin",
                Isbn = "9788441532106",
                Anio = 2008,
                Stock = 12,
                IdCategoria = 2
            },
            new Libro
            {
                IdLibro = 5,
                Titulo = "Sapiens: De animales a dioses",
                Autor = "Yuval Noah Harari",
                Isbn = "9788499926223",
                Anio = 2014,
                Stock = 15,
                IdCategoria = 3
            },
            new Libro
            {
                IdLibro = 6,
                Titulo = "Las venas abiertas de América Latina",
                Autor = "Eduardo Galeano",
                Isbn = "9789502324905",
                Anio = 1971,
                Stock = 8,
                IdCategoria = 3
            },
            new Libro
            {
                IdLibro = 7,
                Titulo = "Meditaciones",
                Autor = "Marco Aurelio",
                Isbn = "9788424937409",
                Anio = 180,
                Stock = 4,
                IdCategoria = 4
            },
            new Libro
            {
                IdLibro = 8,
                Titulo = "Así habló Zaratustra",
                Autor = "Friedrich Nietzsche",
                Isbn = "9788420675398",
                Anio = 1883,
                Stock = 6,
                IdCategoria = 4
            }
        );
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BibliotecaApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categoria",
                columns: table => new
                {
                    IdCategoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categoria", x => x.IdCategoria);
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    IdUsuario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreUsuario = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Lector")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.IdUsuario);
                });

            migrationBuilder.CreateTable(
                name: "Libro",
                columns: table => new
                {
                    IdLibro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Autor = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Isbn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Anio = table.Column<int>(type: "int", nullable: false),
                    Stock = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IdCategoria = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Libro", x => x.IdLibro);
                    table.CheckConstraint("CK_Libro_Stock", "[Stock] >= 0");
                    table.ForeignKey(
                        name: "FK_Libro_Categoria_IdCategoria",
                        column: x => x.IdCategoria,
                        principalTable: "Categoria",
                        principalColumn: "IdCategoria",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Categoria",
                columns: new[] { "IdCategoria", "Nombre" },
                values: new object[,]
                {
                    { 1, "Ficción" },
                    { 2, "Ciencia y Tecnología" },
                    { 3, "Historia" },
                    { 4, "Filosofía" }
                });

            migrationBuilder.InsertData(
                table: "Libro",
                columns: new[] { "IdLibro", "Anio", "Autor", "IdCategoria", "Isbn", "Stock", "Titulo" },
                values: new object[,]
                {
                    { 1, 1967, "Gabriel García Márquez", 1, "9780307474728", 10, "Cien años de soledad" },
                    { 2, 1605, "Miguel de Cervantes", 1, "9788424116286", 5, "Don Quijote de la Mancha" },
                    { 3, 1988, "Stephen Hawking", 2, "9788497593793", 7, "Breve historia del tiempo" },
                    { 4, 2008, "Robert C. Martin", 2, "9788441532106", 12, "El código limpio" },
                    { 5, 2014, "Yuval Noah Harari", 3, "9788499926223", 15, "Sapiens: De animales a dioses" },
                    { 6, 1971, "Eduardo Galeano", 3, "9789502324905", 8, "Las venas abiertas de América Latina" },
                    { 7, 180, "Marco Aurelio", 4, "9788424937409", 4, "Meditaciones" },
                    { 8, 1883, "Friedrich Nietzsche", 4, "9788420675398", 6, "Así habló Zaratustra" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categoria_Nombre",
                table: "Categoria",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Libro_IdCategoria",
                table: "Libro",
                column: "IdCategoria");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_NombreUsuario",
                table: "Usuario",
                column: "NombreUsuario",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Libro");

            migrationBuilder.DropTable(
                name: "Usuario");

            migrationBuilder.DropTable(
                name: "Categoria");
        }
    }
}

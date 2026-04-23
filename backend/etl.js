const fs = require('fs');
const sql = require('mssql');

// Configuración SQL Server
const config = {
    user: 'sa',
    password: 'Charla123!',
    server: 'localhost',
    database: 'sqlserverdemo',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// 🔹 TRANSFORMACIÓN
function transformarProducto(p) {
    return {
        nombre: p.nombre?.trim(),
        precio: parseFloat(p.precio),
        stock: parseInt(p.stock)
    };
}

// 🔹 VALIDACIÓN
function esValido(p) {
    return p.nombre && !isNaN(p.precio) && !isNaN(p.stock);
}

// 🔹 ETL PRINCIPAL
async function ejecutarETL() {
    try {
        await sql.connect(config);

        // EXTRACT
        const data = JSON.parse(fs.readFileSync('../data/productos.json'));

        console.log(`Productos leídos: ${data.length}`);

        for (let p of data) {

            const producto = transformarProducto(p);

            if (!esValido(producto)) {
                console.log("Producto inválido:", p);
                continue;
            }

            // LOAD
            await sql.query`
                IF EXISTS (
                    SELECT 1 FROM Producto WHERE Nombre = ${producto.nombre}
                )
                BEGIN
                    UPDATE Producto
                    SET Precio = ${producto.precio},
                        Stock = ${producto.stock},
                        Descripcion = ${producto.descripcion}
                    WHERE Nombre = ${producto.nombre}
                END
                ELSE
                BEGIN
                    INSERT INTO Producto (Nombre, Precio, Descripcion,Stock, Activo)
                    VALUES (${producto.nombre}, ${producto.precio}, ${producto.descripcion}, ${producto.stock}, 1)
                END
            `;

            console.log(`Insertado: ${producto.nombre}`);
        }

        console.log("ETL completado");

    } catch (err) {
        console.error("Error en ETL:", err);
    } finally {
        sql.close();
    }
}

// Ejecutar
ejecutarETL();
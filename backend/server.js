const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const { conectarProducer, enviarEventoPedido } = require('./kafka');

(async () => {
    try {
        await conectarProducer();
        console.log("Kafka Producer conectado");
    } catch (err) {
        console.error("Error conectando Kafka:", err);
    }
})();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

const config = {
    user: "sa",
    password: "Charla123!",
    server: "localhost",
    database: "sqlserverdemo",
    options: {
        trustServerCertificate: true
    }
};

sql.connect(config);

// Obtener productos
app.get("/productos", async (req, res) => {
    const result = await sql.query("EXEC ObtenerProductos");
    res.json(result.recordset);
});

// Obtener dashboard
app.get("/dashboard", async (req, res) => {
    try {
        const result = await sql.query`EXEC ObtenerDashboard`;

        res.json({
            resumen: result.recordsets[0][0],
            topProductos: result.recordsets[1]
        });

    } catch (err) {
        res.status(500).send(err.message);
    }
});

//Obtener Historial de Compras
app.get("/historial/:email", async (req,res)=>{
    const result = await sql.query`
        EXEC ObtenerVentasCliente @Email=${req.params.email}
    `;
    res.json(result.recordset);
});

// Procesar compra
app.post("/comprar", async (req, res) => {
    try {
        const data = req.body;

        await enviarEventoPedido({
            tipo: "pedido",
            ...data,
            fecha: new Date()
        });

        res.send("Pedido enviado a procesamiento (Kafka) 🚀");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.post("/comprar-sync", async (req, res) => {
    try {
        const {
            nombre,
            email,
            direccion,
            ciudad,
            pais,
            codigoPostal,
            metodoPago,
            numeroTarjeta,
            carrito
        } = req.body;

        const table = new sql.Table();
        table.columns.add("IdProducto", sql.Int);
        table.columns.add("Cantidad", sql.Int);

        carrito.forEach(item => {
            table.rows.add(item.idProducto, item.cantidad);
        });

        const request = new sql.Request();

        request.input("Nombre", sql.VarChar, nombre);
        request.input("Email", sql.VarChar, email);
        request.input("Direccion", sql.VarChar, direccion);
        request.input("Ciudad", sql.VarChar, ciudad);
        request.input("Pais", sql.VarChar, pais);
        request.input("CodigoPostal", sql.VarChar, codigoPostal);
        request.input("MetodoPago", sql.VarChar, metodoPago);
        request.input("NumeroTarjeta", sql.VarChar, numeroTarjeta);
        request.input("Carrito", table);

        await request.execute("ProcesarCompra");

        res.send("Compra realizada con éxito");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.post("/simular-trafico", async (req, res) => {
    try {
        for (let i = 0; i < 50; i++) {

            const carrito = generarCarrito();

            await axios.post("http://localhost:3000/comprar", {
                nombre: "Simulado " + i,
                email: `user${i}@test.com`,
                direccion: "Auto",
                ciudad: "Panama",
                pais: "Panama",
                codigoPostal: "0000",
                metodoPago: Math.random() > 0.5 ? "Tarjeta" : "PayPal",
                numeroTarjeta: "1234567890123456",
                carrito: carrito
            });
        }

        res.send("Tráfico con Kafka generado");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/simular-trafico1", async (req, res) => {
    try {
        for (let i = 0; i < 50; i++) {

            const carrito = generarCarrito();

            await axios.post("http://localhost:3000/comprar-sync", {
                nombre: "Simulado " + i,
                email: `user${i}@test.com`,
                direccion: "Auto",
                ciudad: "Panama",
                pais: "Panama",
                codigoPostal: "0000",
                metodoPago: Math.random() > 0.5 ? "Tarjeta" : "PayPal",
                numeroTarjeta: "1234567890123456",
                carrito: carrito
            });
        }

        res.send("Tráfico con sin Kafka generado");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log("Servidor en puerto 3000"));
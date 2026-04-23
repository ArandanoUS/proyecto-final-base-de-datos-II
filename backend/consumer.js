const { Kafka } = require('kafkajs');
const sql = require('mssql');

// 🔌 Configuración Kafka
const kafka = new Kafka({
    clientId: 'consumer-app',
    brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'grupo-pedidos' });

const dbConfig = {
    user: 'sa',
    password: 'Charla123!',
    server: 'localhost',
    database: 'sqlserverdemo',
    options: {
        trustServerCertificate: true
    }
};

async function run() {
    try {
        // Conectar a DB
        await sql.connect(dbConfig);
        console.log("🟢 Conectado a SQL Server");

        // Conectar Kafka
        await consumer.connect();
        await consumer.subscribe({ topic: 'pedidos', fromBeginning: true });

        console.log("🟢 Consumer escuchando pedidos...");

        await consumer.run({
            eachMessage: async ({ message }) => {
                try {
                    const data = JSON.parse(message.value.toString());

                    console.log("\n📦 Pedido recibido:");
                    console.log(`Cliente: ${data.nombre}`);
                    console.log(`Productos: ${data.carrito?.length || 0}`);

                    // 💰 SIMULACIÓN DE FINANZAS
                    console.log("💰 Enviando a finanzas...");
                    await new Promise(r => setTimeout(r, 1000));

                    console.log("✔ Aprobado por finanzas");

                    // 🧾 Crear tabla tipo TVP
                    const table = new sql.Table();
                    table.columns.add("IdProducto", sql.Int);
                    table.columns.add("Cantidad", sql.Int);

                    data.carrito.forEach(item => {
                        table.rows.add(item.idProducto, item.cantidad);
                    });

                    // ⚙️ Ejecutar SP real
                    const request = new sql.Request();

                    request.input("Nombre", sql.VarChar, data.nombre);
                    request.input("Email", sql.VarChar, data.email);
                    request.input("Direccion", sql.VarChar, data.direccion);
                    request.input("Ciudad", sql.VarChar, data.ciudad);
                    request.input("Pais", sql.VarChar, data.pais);
                    request.input("CodigoPostal", sql.VarChar, data.codigoPostal);
                    request.input("MetodoPago", sql.VarChar, data.metodoPago);
                    request.input("NumeroTarjeta", sql.VarChar, data.numeroTarjeta);
                    request.input("Carrito", table);

                    await request.execute("ProcesarCompra");

                    console.log("✅ Compra procesada en base de datos");
                    console.log("---------------------------");

                } catch (err) {
                    console.error("❌ Error procesando pedido:", err.message);
                }
            },
        });

    } catch (error) {
        console.error("❌ Error general:", error.message);
    }
}

run();
const API = "http://localhost:3000";

function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function saveCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarBadge();
}

function actualizarBadge() {
    const carrito = getCarrito();
    const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    const badge = document.getElementById("cartCount");

    if (totalItems > 0) {
        badge.style.display = "inline";
        badge.innerText = totalItems > 9 ? "9+" : totalItems;
    } else {
        badge.style.display = "none";
    }
}

async function obtenerProductos() {
    const res = await fetch(`${API}/productos`);
    return await res.json();
}

function agregarAlCarrito(producto) {
    let carrito = getCarrito();
    const existente = carrito.find(p => p.IdProducto === producto.IdProducto);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    saveCarrito(carrito);
}


const productosDisponibles = [
    1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
    1002,2002,2003,2004,2005,2006
];

function generarCarrito() {
    const cantidadProductos = Math.floor(Math.random() * 4) + 1;
    const carrito = [];
    const usados = new Set();

    while (carrito.length < cantidadProductos) {
        const randomId = productosDisponibles[
            Math.floor(Math.random() * productosDisponibles.length)
        ];

        if (!usados.has(randomId)) {
            usados.add(randomId);

            carrito.push({
                idProducto: randomId,
                cantidad: Math.floor(Math.random() * 5) + 1
            });
        }
    }

    return carrito;
}
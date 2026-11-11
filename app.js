const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNUpi6R-2ShaKJVoCRpr_eLYHrLtCJYyasOd9LEuubyu1yNoNSR8gp26Quo0IkHrXO/exec";

const ROLES_CONFIG = {
  "9999": { nombre: "CEO", tabs: ["pos", "lotes", "invima", "finanzas", "roas"] },
  "1010": { nombre: "Cajero", tabs: ["pos", "invima"] },
  "2020": { nombre: "Eco-Tuk", tabs: ["pos", "invima"] },
  "3030": { nombre: "Planta", tabs: ["lotes", "invima"] }
};

let catalogoProductos = [
  { sku: "LQ-01", nombre: "Pack x3 Tamales al Vacío", precio: 42000, linea: "Fuerte Vacío" },
  { sku: "LQ-02", nombre: "Tamal Individual Caliente", precio: 16000, linea: "Caliente Punto" },
  { sku: "LQ-03", nombre: "Fiambre Tradicional en Hoja", precio: 25000, linea: "Fuerte Vacío" },
  { sku: "LQ-04", nombre: "Mantequilla Artesanal 250g", precio: 14000, linea: "Acompañante" }
];

let carrito = [];

function formatoCOP(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-CO");
}

function iniciarSesion() {
  const pin = document.getElementById("pinInput").value.trim();
  if (ROLES_CONFIG[pin]) {
    document.getElementById("loginScreen").classList.add("hidden");
    renderizarCatalogo();
  } else {
    document.getElementById("loginError").classList.remove("hidden");
  }
}

function cerrarSesion() {
  document.getElementById("pinInput").value = "";
  document.getElementById("loginScreen").classList.remove("hidden");
}

function renderizarCatalogo() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = catalogoProductos.map(p => `
    <button onclick="agregarAlCarrito('${p.sku}')" class="glass-card-item p-4 rounded-2xl text-left transition flex flex-col justify-between h-32">
      <div>
        <span class="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block">${p.sku}</span>
        <span class="font-medium text-sm text-[#F9F6EE] leading-snug block mt-1">${p.nombre}</span>
      </div>
      <span class="text-base font-serif-luxury font-bold text-[#D4AF37]">${formatoCOP(p.precio)}</span>
    </button>
  `).join("");
}

function agregarAlCarrito(sku) {
  const prod = catalogoProductos.find(p => p.sku === sku);
  const item = carrito.find(i => i.sku === sku);
  if (item) item.cantidad += 1;
  else carrito.push({ ...prod, cantidad: 1 });
  renderizarCarrito();
}

function renderizarCarrito() {
  const cont = document.getElementById("cartItems");
  if (carrito.length === 0) {
    cont.innerHTML = `<p class="text-xs text-[#F9F6EE]/50 italic text-center py-6">Seleccione productos...</p>`;
    document.getElementById("cartTotal").innerText = "$0 COP";
    return;
  }
  let total = 0;
  cont.innerHTML = carrito.map(i => {
    total += i.precio * i.cantidad;
    return `
      <div class="flex items-center justify-between bg-[#320A10]/90 px-3.5 py-2.5 rounded-xl gold-border">
        <p class="font-medium text-xs text-[#F9F6EE]">${i.nombre} (x${i.cantidad})</p>
        <span class="text-xs text-[#D4AF37] font-semibold">${formatoCOP(i.precio * i.cantidad)}</span>
      </div>
    `;
  }).join("");
  document.getElementById("cartTotal").innerText = formatoCOP(total) + " COP";
}

function registrarVentaEnSheets() {
  if (carrito.length === 0) return alert("Agregue productos a la orden.");
  const status = document.getElementById("posStatus");

  const totalCop = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const resumenSkus = carrito.map(i => `${i.cantidad}x ${i.sku}`).join(", ");

  const payload = {
    action: "NEW_SALE",
    canal: document.getElementById("posCanal").value,
    ubicacion: document.getElementById("posUbicacion").value,
    cliente: "Cliente Mostrador",
    telefono: "N/A",
    sku: resumenSkus,
    lote: document.getElementById("posSemilla").value,
    cantidad: 1,
    totalCop: totalCop,
    metodoPago: "Efectivo",
    refBancaria: "EFECTIVO",
    fotoUrl: "Verificado_POS"
  };

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  }).then(() => {
    carrito = [];
    renderizarCarrito();
    status.innerText = "✅ Venta guardada en Google Sheets";
    status.classList.remove("hidden");
    setTimeout(() => status.classList.add("hidden"), 4000);
  });
}

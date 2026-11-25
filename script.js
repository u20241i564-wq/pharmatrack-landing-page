'use strict';

// PharmaTrack Landing Page — frontend demonstration only.
// No personal data is transmitted or persisted.
const navLinks = document.getElementById('nav-links');
const menuButton = document.getElementById('menu-toggle');
if (menuButton && navLinks) menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  if (navLinks && menuButton) {
    navLinks.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
  }
}));
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Interactive mockup views. Use buttons for keyboard accessibility.
function openView(view) {
  if (document.body.classList.contains('standalone-app')) {
    history.replaceState(null, '', '#' + view);
  }
  document.querySelectorAll('.app-nav').forEach(button => {
    const selected = button.dataset.view === view;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('.app-view').forEach(section => {
    const selected = section.id === `view-${view}`;
    section.classList.toggle('active', selected);
    section.hidden = !selected;
  });
}
document.querySelectorAll('.app-nav').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openView(button.dataset.go)));
const initialView = ['overview', 'inventory', 'fefo', 'alerts'].includes(location.hash.substring(1)) ? location.hash.substring(1) : 'overview';
openView(initialView);

// Local sample records, deliberately NOT connected to SQL Server or any API.
const inventory = [
  { product: 'Amoxicilina 500 mg', lot: 'LOT-001', expiration: '15/01/2027', stock: 40, state: 'Disponible' },
  { product: 'Amoxicilina 500 mg', lot: 'LOT-002', expiration: '20/03/2027', stock: 80, state: 'Disponible' },
  { product: 'Amoxicilina 500 mg', lot: 'LOT-003', expiration: '10/01/2027', stock: 50, state: 'Inmovilizado' },
  { product: 'Paracetamol 500 mg', lot: 'LOT-018', expiration: '01/02/2027', stock: 26, state: 'Próx. vencimiento' },
  { product: 'Ibuprofeno 400 mg', lot: 'LOT-027', expiration: '12/12/2027', stock: 130, state: 'Disponible' },
];
const searchInput = document.getElementById('inventory-search');
const inventoryBody = document.getElementById('inventory-rows');
function renderInventory(term = '') {
  const search = term.trim().toLocaleLowerCase('es');
  const rows = inventory.filter(item => `${item.product} ${item.lot} ${item.state}`.toLocaleLowerCase('es').includes(search));
  inventoryBody.replaceChildren();
  if (!rows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td'); cell.colSpan = 5; cell.className = 'no-results'; cell.textContent = 'No se encontraron resultados.';
    row.appendChild(cell); inventoryBody.appendChild(row); return;
  }
  for (const item of rows) {
    const row = document.createElement('tr');
    for (const value of [item.product, item.lot, item.expiration, String(item.stock)]) {
      const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell);
    }
    const cell = document.createElement('td'); const chip = document.createElement('span');
    chip.className = `table-chip ${item.state === 'Inmovilizado' ? 'chip-red' : item.state === 'Disponible' ? 'chip-green' : 'chip-yellow'}`;
    chip.textContent = item.state; cell.appendChild(chip); row.appendChild(cell); inventoryBody.appendChild(row);
  }
}
renderInventory();
searchInput.addEventListener('input', () => renderInventory(searchInput.value));

// FEFO = First Expired, First Out; exclude immobilized/expired/exhausted lots.
const demoLots = [
  { code: 'LOT-003', expires: '2027-01-10', stock: 50, immobilized: true },
  { code: 'LOT-001', expires: '2027-01-15', stock: 40, immobilized: false },
  { code: 'LOT-002', expires: '2027-03-20', stock: 80, immobilized: false },
];
function recommendFefo(lots, requested, today = '2026-11-22') {
  if (!Number.isInteger(requested) || requested <= 0) throw new Error('Ingresa una cantidad entera mayor que cero.');
  const eligible = lots.filter(lot => !lot.immobilized && lot.stock > 0 && lot.expires >= today).sort((a, b) => a.expires.localeCompare(b.expires) || a.code.localeCompare(b.code));
  if (eligible.reduce((total, lot) => total + lot.stock, 0) < requested) throw new Error('Stock elegible insuficiente para completar la solicitud.');
  const allocation = []; let remaining = requested;
  for (const lot of eligible) {
    if (!remaining) break;
    const quantity = Math.min(lot.stock, remaining);
    allocation.push({ code: lot.code, quantity }); remaining -= quantity;
  }
  return allocation;
}
const calculateButton = document.getElementById('calculate-fefo');
const fefoOutput = document.getElementById('fefo-output');
const fefoMessage = document.getElementById('fefo-message');
calculateButton.addEventListener('click', () => {
  const quantity = Number(document.getElementById('fefo-quantity').value);
  fefoOutput.replaceChildren();
  const heading = document.createElement('h4'); heading.textContent = 'Recomendación'; fefoOutput.appendChild(heading);
  try {
    const result = recommendFefo(demoLots, quantity);
    result.forEach(item => {
      const row = document.createElement('div'); row.className = 'result-line';
      const lot = document.createElement('strong'); lot.textContent = item.code;
      const amount = document.createElement('span'); amount.textContent = `${item.quantity} unidades`;
      row.append(lot, amount); fefoOutput.appendChild(row);
    });
    const total = document.createElement('p'); total.className = 'result-total'; total.textContent = `Total asignado: ${quantity} unidades`;
    fefoOutput.appendChild(total);
    fefoMessage.textContent = 'Recomendación calculada. No se modificó ningún inventario.';
    fefoMessage.className = 'fefo-message success-message';
  } catch (error) {
    const p = document.createElement('p'); p.textContent = error.message; fefoOutput.appendChild(p);
    fefoMessage.textContent = 'Corrige la cantidad e inténtalo nuevamente.';
    fefoMessage.className = 'fefo-message error-message';
  }
});


// Links that open a specific preview panel before scrolling to it.
document.querySelectorAll('[data-open-view]').forEach(link => {
  link.addEventListener('click', () => openView(link.dataset.openView));
});

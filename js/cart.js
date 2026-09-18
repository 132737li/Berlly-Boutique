/* --- Berlly Boutique - Gestion du panier & commande --- */

const CART_KEY = 'berlly_cart';
const WHATSAPP_NUMBER = '25776672387'; // numéro WhatsApp de la boutique

/* ---------- Utilitaires panier ---------- */

function getCart() {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(id, name, price, image, quantity = 1) {
    quantity = parseInt(quantity) || 1;
    const cart = getCart();
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id, name, price: Number(price), image, quantity });
    }

    saveCart(cart);
    showToast(`${name} ajouté au panier ✔`);
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    renderCartPage();
}

function updateQuantity(id, quantity) {
    quantity = parseInt(quantity);
    let cart = getCart();

    if (quantity < 1) {
        cart = cart.filter(item => item.id !== id);
    } else {
        const item = cart.find(item => item.id === id);
        if (item) item.quantity = quantity;
    }

    saveCart(cart);
    renderCartPage();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function formatFBu(amount) {
    return Math.round(amount).toLocaleString('fr-FR') + ' FBu';
}

/* ---------- Badge du panier (dans le header) ---------- */

function updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(badge => {
        const count = getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

/* ---------- Notification (toast) ---------- */

function showToast(message) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Page Panier ---------- */

function renderCartPage() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-value');
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <p class="empty-cart">
                Votre panier est vide.
                <a href="produits.html">Voir nos produits</a>
            </p>`;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">

                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p class="price">${formatFBu(item.price)}</p>
                </div>

                <div class="cart-item-qty">
                    <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>

                <p class="cart-item-subtotal">${formatFBu(item.price * item.quantity)}</p>

                <button type="button" class="remove-btn" onclick="removeFromCart('${item.id}')" title="Retirer">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    if (totalEl) totalEl.textContent = formatFBu(getCartTotal());
}

/* ---------- Page Produit (détail avec quantité) ---------- */

function changeProductQty(delta) {
    const input = document.getElementById('product-qty');
    if (!input) return;
    const min = parseInt(input.min) || 1;
    let value = (parseInt(input.value) || min) + delta;
    if (value < min) value = min;
    input.value = value;
    updateProductSubtotal();
}

function updateProductSubtotal() {
    const input = document.getElementById('product-qty');
    const subtotalEl = document.getElementById('product-subtotal');
    if (!input || !subtotalEl) return;

    const price = Number(subtotalEl.dataset.price || 0);
    const qty = parseInt(input.value) || 1;
    subtotalEl.textContent = formatFBu(price * qty);
}

function addProductToCart(id, name, price, image) {
    const input = document.getElementById('product-qty');
    const qty = input ? (parseInt(input.value) || 1) : 1;
    addToCart(id, name, price, image, qty);
}

/* ---------- Page Commande ---------- */

function renderOrderSummary() {
    const container = document.getElementById('order-items');
    const totalEl = document.getElementById('order-total-value');
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <p>
                Votre panier est vide.
                <a href="produits.html">Voir les produits</a>
            </p>`;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="order-item">
                <span>${item.name} &times; ${item.quantity}</span>
                <span>${formatFBu(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    if (totalEl) totalEl.textContent = formatFBu(getCartTotal());
}

/* Affiche les instructions/champs propres au mode de paiement choisi */
function togglePaymentDetails() {
    const select = document.getElementById('payment-method');
    if (!select) return;

    document.querySelectorAll('.payment-details').forEach(el => {
        el.style.display = 'none';
        el.querySelectorAll('input').forEach(inp => inp.required = false);
    });

    const target = document.getElementById('details-' + select.value);
    if (target) {
        target.style.display = 'block';
        target.querySelectorAll('input[data-required="true"]').forEach(inp => inp.required = true);
    }
}

/* Valide et envoie la commande via WhatsApp */
function handleOrderSubmit(event) {
    event.preventDefault();
    const currentUser = JSON.parse(
    localStorage.getItem('berlly_current_user')
);

if (!currentUser) {
    alert(
        'Vous devez créer un compte ou vous connecter avant de passer une commande.'
    );

    window.location.href = 'connexion.html';

    return false;
}

    const cart = getCart();
    if (cart.length === 0) {
        alert('Votre panier est vide. Ajoutez des produits avant de commander.');
        return false;
    }

    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if (!name || !phone || !address) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return false;
    }

    const paymentSelect = document.getElementById('payment-method');
    const paymentValue = paymentSelect.value;
    const paymentLabel = paymentSelect.options[paymentSelect.selectedIndex].text;

    let transactionRef = '';
    if (paymentValue === 'lumicash' || paymentValue === 'ecocash') {
        const refInput = document.getElementById('ref-' + paymentValue);
        transactionRef = refInput ? refInput.value.trim() : '';
        if (!transactionRef) {
            alert('Veuillez indiquer le code de transaction reçu par SMS après votre paiement ' + paymentLabel + '.');
            return false;
        }
    }

    const total = getCartTotal();

    // Construction du message WhatsApp
    let message = '🛍️ *Nouvelle commande - Berlly Boutique*\n\n';
    message += `👤 Nom : ${name}\n`;
    message += `📞 Téléphone : ${phone}\n`;
    message += `🏠 Adresse : ${address}\n\n`;
    message += '📦 *Produits commandés :*\n';
    cart.forEach(item => {
        message += `- ${item.name} x${item.quantity} = ${formatFBu(item.price * item.quantity)}\n`;
    });
    message += `\n💰 *Total : ${formatFBu(total)}*\n`;
    message += `💳 Paiement : ${paymentLabel}\n`;
    if (transactionRef) {
        message += `🔖 Référence de transaction : ${transactionRef}\n`;
    }

    // Sauvegarde locale de la dernière commande (utile pour un futur suivi)
    /* ---------- Enregistrement de la commande ---------- */

const ORDERS_KEY = 'berlly_orders';

const orders = JSON.parse(
    localStorage.getItem(ORDERS_KEY) || '[]'
);

const newOrder = {
    id: 'CMD-' + Date.now(),

    name: name,
    phone: phone,
    address: address,

    cart: cart,

    total: total,

    payment: paymentLabel,

    transactionRef: transactionRef,

    date: new Date().toISOString(),

    status: 'En attente'
};

const currentUser =
    JSON.parse(
        localStorage.getItem('berlly_current_user')
    );

const newOrder = {

    id: 'CMD-' + Date.now(),

    userId: currentUser ? currentUser.id : null,

    email: currentUser ? currentUser.email : null,

    name: name,

    phone: phone,

    address: address,

    cart: cart,

    total: total,

    payment: paymentLabel,

    transactionRef: transactionRef,

    date: new Date().toISOString(),

    status: 'En attente'
};

/* Ajouter la nouvelle commande à l'historique */
orders.push(newOrder);

/* Sauvegarder toutes les commandes */
localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders)
);

/* Garder aussi la dernière commande */
localStorage.setItem(
    'berlly_last_order',
    JSON.stringify(newOrder)
);
   /* localStorage.setItem('berlly_last_order', JSON.stringify({
        name, phone, address, cart, total,
        payment: paymentLabel, transactionRef,
        date: new Date().toISOString()
    }));*/


    clearCart();

    const encoded = encodeURIComponent(message);
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    return false;
}

/* ---------- Recherche de produits (page produits.html) ---------- */

function filterProducts(query) {
    const term = query.trim().toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('h2, h3');
        const name = title ? title.textContent.toLowerCase() : '';
        card.style.display = name.includes(term) ? '' : 'none';
    });
}

/* ---------- Initialisation sur chaque page ---------- */

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderCartPage();
    renderOrderSummary();
    togglePaymentDetails();
    updateProductSubtotal();
});

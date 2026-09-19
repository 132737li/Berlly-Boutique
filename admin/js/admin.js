/* =========================================
   BERLLY BOUTIQUE
   ADMINISTRATION
========================================= */

const API_BASE_URL = "http://localhost:5000";

let ordersCache = [];


/* =========================================
   EN-TÊTES AVEC TOKEN
========================================= */

function getAuthHeaders() {

    const token = localStorage.getItem("berlly_token");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

}


/* =========================================
   RÉCUPÉRER LES COMMANDES DEPUIS LE BACKEND
========================================= */

async function fetchOrders() {

    try {

        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {

            if (response.status === 401 || response.status === 403) {
                window.location.href = "index.html";
                return [];
            }

            throw new Error("Erreur lors du chargement des commandes.");

        }

        ordersCache = await response.json();

        return ordersCache;

    } catch (err) {

        console.error(err);
        return [];

    }

}


/* =========================================
   FORMAT PRIX
========================================= */

function formatMoney(amount) {

    return Math.round(Number(amount) || 0)
        .toLocaleString("fr-FR") + " FBu";

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(date) {

    if (!date) return "-";

    return new Date(date).toLocaleString("fr-FR");

}


/* =========================================
   PROTECTION ADMIN
========================================= */

function checkAdminAccess() {

    const currentPage =
        window.location.pathname.split("/").pop();

    if (currentPage === "index.html" || currentPage === "") {
        return;
    }

    const token = localStorage.getItem("berlly_token");
    const adminData = localStorage.getItem("berlly_admin");

    if (!token || !adminData) {
        window.location.href = "index.html";
        return;
    }

    const admin = JSON.parse(adminData);

    if (admin.role !== "admin") {
        window.location.href = "index.html";
    }

}


/* =========================================
   CONNEXION ADMIN
========================================= */

function setupLogin() {

    const form =
        document.getElementById("admin-login-form");

    if (!form) return;


    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("admin-username")
                .value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("admin-password")
                .value;

        const errorMsg =
            document.getElementById("login-error");

        errorMsg.textContent = "Connexion en cours...";

        try {

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    motDePasse: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMsg.textContent =
                    data.message || "Nom d'utilisateur ou mot de passe incorrect.";
                return;
            }

            if (data.utilisateur.role !== "admin") {
                errorMsg.textContent =
                    "Ce compte n'a pas les droits administrateur.";
                return;
            }

            localStorage.setItem("berlly_token", data.token);
            localStorage.setItem("berlly_admin", JSON.stringify(data.utilisateur));

            window.location.href = "dashboard.html";

        } catch (err) {

            errorMsg.textContent =
                "Impossible de contacter le serveur. Vérifie que le backend est démarré.";

            console.error(err);
        }

    });

}


/* =========================================
   DÉCONNEXION
========================================= */

function setupLogout() {

    const button =
        document.getElementById("logout-button");

    if (!button) return;


    button.addEventListener("click", function() {

        localStorage.removeItem("berlly_token");
        localStorage.removeItem("berlly_admin");

        window.location.href = "index.html";

    });

}


/* =========================================
   DASHBOARD
========================================= */

async function loadDashboard() {

    const totalElement =
        document.getElementById("total-orders");

    if (!totalElement) return;


    const orders = await fetchOrders();


    const pending =
        orders.filter(
            order => order.status === "En attente"
        ).length;


    const confirmed =
        orders.filter(
            order => order.status === "Confirmée"
        ).length;


    const totalSales =
        orders.reduce(
            (total, order) =>
                total + Number(order.total || 0),
            0
        );


    totalElement.textContent =
        orders.length;


    document.getElementById(
        "pending-orders"
    ).textContent = pending;


    document.getElementById(
        "confirmed-orders"
    ).textContent = confirmed;


    document.getElementById(
        "total-sales"
    ).textContent =
        formatMoney(totalSales);


    loadRecentOrders(orders);

}


/* =========================================
   DERNIÈRES COMMANDES
========================================= */

function loadRecentOrders(orders) {

    const container =
        document.getElementById("recent-orders");

    if (!container) return;


    const recent =
        [...orders]
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        )
        .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <tr>

                <td colspan="6"
                    style="text-align:center;padding:30px;">

                    Aucune commande enregistrée.

                </td>

            </tr>

        `;

        return;

    }


    container.innerHTML =
        recent.map(order => `

            <tr>

                <td>
                    ${escapeHTML(order._id)}
                </td>

                <td>
                    ${escapeHTML(order.name)}
                </td>

                <td>
                    ${escapeHTML(order.phone)}
                </td>

                <td>
                    ${formatMoney(order.total)}
                </td>

                <td>
                    ${formatDate(order.createdAt)}
                </td>

                <td>
                    ${getStatusHTML(order.status)}
                </td>

            </tr>

        `).join("");

}


/* =========================================
   HISTORIQUE
========================================= */

async function loadOrdersTable() {

    const table =
        document.getElementById("orders-table");

    if (!table) return;


    await fetchOrders();

    displayOrders();


    const search =
        document.getElementById("order-search");

    const filter =
        document.getElementById("status-filter");


    if (search) {

        search.addEventListener(
            "input",
            displayOrders
        );

    }


    if (filter) {

        filter.addEventListener(
            "change",
            displayOrders
        );

    }

}


/* =========================================
   AFFICHER LES COMMANDES
========================================= */

function displayOrders() {

    const table =
        document.getElementById("orders-table");

    if (!table) return;


    let orders = [...ordersCache];


    const search =
        document.getElementById("order-search")
            ?.value
            .toLowerCase()
            .trim();


    const status =
        document.getElementById("status-filter")
            ?.value;


    /* RECHERCHE */

    if (search) {

        orders = orders.filter(order => {

            return (

                String(order._id)
                    .toLowerCase()
                    .includes(search)

                ||

                String(order.name)
                    .toLowerCase()
                    .includes(search)

                ||

                String(order.phone)
                    .toLowerCase()
                    .includes(search)

            );

        });

    }


    /* FILTRE STATUT */

    if (
        status &&
        status !== "all"
    ) {

        orders = orders.filter(
            order =>
                order.status === status
        );

    }


    /* PLUS RÉCENT EN PREMIER */

    orders.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    if (orders.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="9"
                    style="text-align:center;padding:30px;">

                    Aucune commande trouvée.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML =
        orders.map(order => `

            <tr>

                <td>
                    <strong>
                        ${escapeHTML(order._id)}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(order.name)}
                </td>


                <td>
                    ${escapeHTML(order.phone)}
                </td>


                <td>
                    ${escapeHTML(order.address)}
                </td>


                <td>
                    <strong>
                        ${formatMoney(order.total)}
                    </strong>
                </td>


                <td>
                    ${escapeHTML(order.payment)}
                </td>


                <td>
                    ${formatDate(order.createdAt)}
                </td>


                <td>

                    <select
                        onchange="changeOrderStatus('${order._id}', this.value)"
                    >

                        <option value="En attente"
                            ${order.status === "En attente" ? "selected" : ""}>
                            En attente
                        </option>

                        <option value="Confirmée"
                            ${order.status === "Confirmée" ? "selected" : ""}>
                            Confirmée
                        </option>

                        <option value="Livrée"
                            ${order.status === "Livrée" ? "selected" : ""}>
                            Livrée
                        </option>

                        <option value="Annulée"
                            ${order.status === "Annulée" ? "selected" : ""}>
                            Annulée
                        </option>

                    </select>

                </td>


                <td>

                    <button
                        class="action-button view-button"
                        onclick="viewOrder('${order._id}')"
                        title="Voir les détails"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    <button
                        class="action-button delete-button"
                        onclick="deleteOrder('${order._id}')"
                        title="Supprimer"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

        `).join("");

}


/* =========================================
   MODIFIER LE STATUT
========================================= */

async function changeOrderStatus(id, newStatus) {

    try {

        const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la mise à jour.");
        }

        await fetchOrders();
        displayOrders();

    } catch (err) {

        console.error(err);
        alert("Impossible de modifier le statut de la commande.");

    }

}


/* =========================================
   VOIR UNE COMMANDE
========================================= */

function viewOrder(id) {

    const order =
        ordersCache.find(
            item => item._id === id
        );


    if (!order) return;


    const modal =
        document.getElementById("order-modal");


    const details =
        document.getElementById("order-details");


    if (!modal || !details) return;


    const products =
        Array.isArray(order.cart)
            ? order.cart
            : [];


    let productsHTML = "";


    if (products.length > 0) {

        productsHTML =
            products.map(product => `

                <div class="order-product">

                    <span>

                        ${escapeHTML(product.name)}

                        × ${Number(product.quantity) || 1}

                    </span>

                    <strong>

                        ${formatMoney(
                            Number(product.price || 0) *
                            Number(product.quantity || 1)
                        )}

                    </strong>

                </div>

            `).join("");

    }

    else {

        productsHTML =
            "<p>Aucun produit enregistré.</p>";

    }


    details.innerHTML = `

        <div class="order-detail-line">
            <strong>Numéro :</strong>
            ${escapeHTML(order._id)}
        </div>

        <div class="order-detail-line">
            <strong>Client :</strong>
            ${escapeHTML(order.name)}
        </div>

        <div class="order-detail-line">
            <strong>Téléphone :</strong>
            ${escapeHTML(order.phone)}
        </div>

        <div class="order-detail-line">
            <strong>Adresse :</strong>
            ${escapeHTML(order.address)}
        </div>

        <div class="order-detail-line">
            <strong>Paiement :</strong>
            ${escapeHTML(order.payment)}
        </div>

        <div class="order-detail-line">
            <strong>Référence :</strong>
            ${escapeHTML(
                order.transactionRef || "Aucune"
            )}
        </div>

        <div class="order-detail-line">
            <strong>Date :</strong>
            ${formatDate(order.createdAt)}
        </div>

        <div class="order-detail-line">
            <strong>Statut :</strong>
            ${getStatusHTML(order.status)}
        </div>

        <div class="order-products">

            <h3>Produits commandés</h3>

            ${productsHTML}

        </div>

        <h3 style="margin-top:20px;">

            Total :
            ${formatMoney(order.total)}

        </h3>

    `;


    modal.classList.add("show");

}


/* =========================================
   SUPPRIMER
========================================= */

async function deleteOrder(id) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer cette commande ?"
        );


    if (!confirmation) return;


    try {

        const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la suppression.");
        }

        await fetchOrders();
        displayOrders();
        loadDashboard();

    } catch (err) {

        console.error(err);
        alert("Impossible de supprimer la commande.");

    }

}


/* =========================================
   STATUT
========================================= */

function getStatusHTML(status) {

    let className =
        "status-pending";


    if (status === "Confirmée") {

        className =
            "status-confirmed";

    }

    else if (status === "Livrée") {

        className =
            "status-delivered";

    }

    else if (status === "Annulée") {

        className =
            "status-cancelled";

    }


    return `

        <span class="status ${className}">

            ${escapeHTML(
                status || "En attente"
            )}

        </span>

    `;

}


/* =========================================
   PROTECTION CONTRE HTML
========================================= */

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   MODAL
========================================= */

function setupModal() {

    const modal =
        document.getElementById("order-modal");


    const close =
        document.getElementById("close-modal");


    if (!modal || !close) return;


    close.addEventListener(
        "click",
        function() {

            modal.classList.remove("show");

        }
    );


    modal.addEventListener(
        "click",
        function(event) {

            if (event.target === modal) {

                modal.classList.remove("show");

            }

        }
    );

}


/* =========================================
   DÉMARRAGE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        checkAdminAccess();

        setupLogin();

        setupLogout();

        loadDashboard();

        loadOrdersTable();

        setupModal();

    }
);
const API_URL = "http://localhost:3000";

// Fetch and display the current status
async function fetchStatus() {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();

    // Populate Pending Orders
    const pendingOrders = document.getElementById("pendingOrders");
    pendingOrders.innerHTML = data.orders
        .map(order => `<li>Order #${order.id} (${order.type})${order.processing ? " - Processing" : ""}</li>`)
        .join("");

    // Populate Completed Orders
    const completedOrders = document.getElementById("completedOrders");
    completedOrders.innerHTML = data.completedOrders
        .map(order => `<li>Order #${order.id} (${order.type})</li>`)
        .join("");

    // Display Bot Information
    const botStatus = document.getElementById("botStatus");
    botStatus.innerHTML = data.bots.length
        ? data.bots.map(botId => `Bot ${botId}`).join(", ")
        : "No bots available";
}

// Add a new order
async function addOrder(type) {
    await fetch(`${API_URL}/new-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
    });
    fetchStatus();  // Refresh status after adding an order
}

// Add a new bot
async function addBot() {
    await fetch(`${API_URL}/add-bot`, { method: "POST" });
    fetchStatus();  // Refresh status after adding a bot
}

// Remove the newest bot
async function removeBot() {
    await fetch(`${API_URL}/remove-bot`, { method: "POST" });
    fetchStatus();  // Refresh status after removing a bot
}

// Initial load
fetchStatus();
setInterval(fetchStatus, 1000); // Refresh every second

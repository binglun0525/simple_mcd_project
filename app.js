const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data
let orderId = 1;
const pendingOrders = [];
const completedOrders = [];
const bots = {}; // Use an object to store bot details (id and timer references)

// Helper function to process orders
function processOrder(botId) {
    const orderIndex = pendingOrders.findIndex(order => !order.processing);

    if (orderIndex >= 0) {
        const order = pendingOrders[orderIndex];
        order.processing = true; // Mark as processing
        console.log(`Bot ${botId} started processing Order #${order.id}`);

        // Save the timeout reference in the bot
        bots[botId].timer = setTimeout(() => {
            completedOrders.push(order);
            pendingOrders.splice(orderIndex, 1); // Remove from pending
            console.log(`Bot ${botId} completed Order #${order.id}`);
            processOrder(botId); // Continue processing the next order
        }, 10000); // 10 seconds delay
    } else {
        console.log(`Bot ${botId} is idle`);
    }
}

// API Endpoints

// Get current status
app.get("/status", (req, res) => {
    res.json({ orders: pendingOrders, completedOrders, bots: Object.keys(bots) });
});

// Add a new order
app.post("/new-order", (req, res) => {
    const { type } = req.body;
    const order = { id: orderId++, type, processing: false };
    if (type === "VIP") {
        // VIP orders go before normal orders
        const vipIndex = pendingOrders.findIndex(o => o.type !== "VIP");
        if (vipIndex === -1) {
            pendingOrders.push(order);
        } else {
            pendingOrders.splice(vipIndex, 0, order);
        }
    } else {
        pendingOrders.push(order);
    }
    console.log(`Added ${type} Order #${order.id}`);
    res.status(201).json(order);
});

// Add a new bot
app.post("/add-bot", (req, res) => {
    const botId = Object.keys(bots).length + 1;
    bots[botId] = {}; // Create a new bot
    console.log(`Bot ${botId} added`);
    processOrder(botId); // Start processing orders
    res.status(201).json({ id: botId });
});

// Remove the newest bot
app.post("/remove-bot", (req, res) => {
    const botIds = Object.keys(bots);
    if (botIds.length > 0) {
        const botId = botIds[botIds.length - 1];
        const bot = bots[botId];

        // Clear the bot's timer
        if (bot.timer) {
            clearTimeout(bot.timer);
            console.log(`Bot ${botId} stopped processing`);

            // If the bot was processing an order, reset its status
            const order = pendingOrders.find(order => order.processing);
            if (order) {
                order.processing = false;
                console.log(`Order #${order.id} reset to pending`);
            }
        }

        delete bots[botId];
        console.log(`Bot ${botId} removed`);
        res.status(200).send({ message: `Bot ${botId} removed` });
    } else {
        res.status(400).send({ message: "No bots to remove" });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

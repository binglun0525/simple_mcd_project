const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let orderId = 1;
let pendingOrders = [];
let completedOrders = [];
const bots = {}; // Store bot data

// Add a new order
app.post("/new-order", (req, res) => {
    const { type } = req.body;
    const order = { id: orderId++, type, processing: false, processingBy: null };

    // Add order to pendingOrders based on type
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

    // Check if there are any idle bots and assign them orders
    Object.keys(bots).forEach(botId => {
        // If bot is idle (not processing any order), start processing a new order
        if (!pendingOrders.find(order => order.processingBy === botId) && pendingOrders.length > 0) {
            processOrder(botId); // Start processing if the bot is idle and there are pending orders
        }
    });

    res.status(201).json(order);
});

// Helper function to process orders
function processOrder(botId) {
    // Find the next unprocessed order
    var orderIndex = pendingOrders.findIndex(order => !order.processing && !order.processingBy);

    // If there's no unprocessed order, stop further processing
    if (orderIndex < 0) {
        console.log(`Bot ${botId} is idle, no orders to process`);
        return; // Stop further processing
    }

    var order = pendingOrders[orderIndex];
    var order_id = order.id;

    order.processingBy = botId; // Mark order as being processed by this bot
    order.processing = true; // Mark as processing
    console.log(`Bot ${botId} started processing Order #${order.id}`);

    // Save the timeout reference in the bot
    bots[botId].timer = setTimeout(() => {
        completedOrders.push(order); // Push to completed area
        pendingOrders = pendingOrders.filter(order => order.id !== order_id); // Remove from pending area

        console.log(`Bot ${botId} completed Order #${order.id}`);

        // After completing an order, check for new orders to process
        processOrder(botId); // Continue processing the next order if available
    }, 10000); // 10 seconds delay for processing each order
}


// Get current status
app.get("/status", (req, res) => {
    res.json({ orders: pendingOrders, completedOrders, bots: Object.keys(bots) });
});

// Add a new bot
app.post("/add-bot", (req, res) => {
    const botId = Object.keys(bots).length + 1;
    bots[botId] = {};
    console.log(`Bot ${botId} added`);

    // Start processing orders immediately
    processOrder(botId);
    res.status(201).json({ id: botId });
});

// Remove the newest bot
app.post("/remove-bot", (req, res) => {
    const botIds = Object.keys(bots);
    if (botIds.length > 0) {
        const botId = botIds[botIds.length - 1];  // Get the newest bot
        const bot = bots[botId];

        // Find the order that was being processed by this bot
        const order = pendingOrders.find(order => order.processingBy == botId);

        if (order) {
            // Move the order back to "PENDING" and remove the processing bot reference
            order.processingBy = null;
            order.status = 'PENDING';
            order.processing = false;
            console.log(`Order #${order.id} is now back in the pending queue`);
        }

        // Clear the bot's timer if it exists
        if (bot.timer) {
            clearTimeout(bot.timer);
            console.log(`Bot ${botId} stopped processing`);
        }

        // Remove the bot from the bots object
        delete bots[botId];
        console.log(`Bot ${botId} removed`);

        // After removing the bot, check if any other bot should start processing
        for (const id of Object.keys(bots)) {
            if (!pendingOrders.find(order => order.processing)) {
                processOrder(id);  // Start processing if there are no orders being processed
            }
        }

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

import express from "express";
import cors from "cors";
import vhost from "vhost";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";

// Import routing
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminBookRoutes from "./routes/adminBookRoutes.js";
import adminCategoryRoutes from "./routes/adminCategoryRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import orderItemRoutes from "./routes/orderItemRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import midtransWebhook from "./routes/midtransWebhook.js";

const app = express();
const adminApp = express(); // Sub-app untuk admin
const PORT = process.env.PORT || 5000;

const corsConfig = {
    origin: "http://localhost:3000",
    credentials: true,
};

app.use(express.json());
app.use(cors(corsConfig));
app.use(cookieParser());

// Konfigurasi subdomain admin
adminApp.use(express.json());
adminApp.use("/api/v1/admin", adminRoutes);
adminApp.use("/api/v1/admin/books", adminBookRoutes);
adminApp.use("/api/v1/admin/categories", adminCategoryRoutes);

// Gunakan vhost untuk mengarahkan subdomain ke adminApp
app.use(vhost("admin.localhost", adminApp));

// Routes utama
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/order-items', orderItemRoutes);
app.use('/api/v1/checkout', checkoutRoutes);

app.use('/api/v1/midtrans/webhook', midtransWebhook);

async function startServer() {
    await connectDB(); // Koneksi ke database

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();

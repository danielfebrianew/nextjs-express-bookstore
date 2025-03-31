import express from "express";
import cors from "cors";
import vhost from "vhost";
import cookieParser from "cookie-parser";

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
const adminApp = express();

const corsConfig = {
  origin: "http://localhost:3000",
  credentials: true,
};

// Rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP
  message: 'Terlalu banyak request, coba lagi nanti.',
});

// Apply rate limiting for all routes
app.use(limiter); // Taruh di sini supaya semua route kena rate limit

app.use(express.json());
app.use(cors(corsConfig));
app.use(cookieParser());

// Subdomain admin
adminApp.use(express.json());
adminApp.use("/api/v1/admin", adminRoutes);
adminApp.use("/api/v1/admin/books", adminBookRoutes);
adminApp.use("/api/v1/admin/categories", adminCategoryRoutes);
app.use(vhost("admin.localhost", adminApp));

// Main routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/carts", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/order-items", orderItemRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/midtrans/webhook", midtransWebhook);

export default app;

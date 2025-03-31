import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const router = express.Router();

// Define Zod schema for orderItems validation
const orderItemSchema = z.object({
  bookId: z.string().uuid(), // Assuming bookId is a UUID string
  quantity: z.number().int().positive(), // quantity must be a positive integer
});

const orderSchema = z.object({
  orderItems: z.array(orderItemSchema).min(1, "Order must have at least one item"),
});

// Buat pesanan baru
router.post("/", authenticateUser, async (req, res) => {
  try {
    // Validate request body with Zod
    const parsedOrder = orderSchema.safeParse(req.body);
    if (!parsedOrder.success) {
      logger.error("Order validation failed", { errors: parsedOrder.error.errors });
      return res.status(400).json({ error: "Invalid order data", details: parsedOrder.error.errors });
    }

    const { orderItems } = req.body;

    // Log the incoming request
    logger.info(`Creating new order for user ID ${req.user.id}`);

    // Ambil harga buku dari database berdasarkan bookId
    const books = await prisma.book.findMany({
      where: {
        id: { in: orderItems.map((item) => item.bookId) },
      },
      select: {
        id: true,
        price: true,
      },
    });

    // Mapping harga buku berdasarkan bookId
    const bookPriceMap = books.reduce((map, book) => {
      map[book.id] = book.price;
      return map;
    }, {});

    // Hitung totalAmount berdasarkan price * quantity
    let totalAmount = 0;
    const orderItemsData = orderItems.map((item) => {
      const price = bookPriceMap[item.bookId];
      if (!price) {
        logger.error(`Book with ID ${item.bookId} not found`);
        throw new Error(`Book with ID ${item.bookId} not found`);
      }
      totalAmount += price * item.quantity;
      return {
        bookId: item.bookId,
        quantity: item.quantity,
        price,
      };
    });

    // Buat pesanan baru dengan totalAmount yang sudah dihitung
    const newOrder = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { orderItems: true },
    });

    logger.info(`Order created successfully for user ID ${req.user.id}`, { orderId: newOrder.id });
    res.status(201).json(newOrder);
  } catch (error) {
    logger.error("Error creating order", { error: error.message });
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
});

// Ambil semua pesanan user
router.get("/", authenticateUser, async (req, res) => {
  try {
    logger.info(`Fetching orders for user ID ${req.user.id}`);

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { orderItems: true },
    });

    logger.info(`Fetched orders for user ID ${req.user.id}`, { orderCount: orders.length });
    res.json(orders);
  } catch (error) {
    logger.error("Error fetching orders", { error: error.message });
    res.status(500).json({ error: "Failed to fetch orders", details: error.message });
  }
});

// Ambil detail pesanan berdasarkan ID
router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    logger.info(`Fetching order details for user ID ${req.user.id}, order ID ${id}`);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order || order.userId !== req.user.id) {
      logger.warn(`Order not found or unauthorized access for order ID ${id}`);
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    res.json(order);
  } catch (error) {
    logger.error("Error fetching order", { error: error.message });
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update status pesanan
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status using Zod
  const statusSchema = z.enum(["pending", "paid", "shipped", "completed"]);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) {
    logger.error("Invalid order status", { status });
    return res.status(400).json({ error: "Invalid order status" });
  }

  try {
    logger.info(`Updating status for order ID ${id} to ${status}`);

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || order.userId !== req.user.id) {
      logger.warn(`Order not found or unauthorized access for order ID ${id}`);
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    logger.info(`Order status updated for order ID ${id}`, { status: updatedOrder.status });
    res.json(updatedOrder);
  } catch (error) {
    logger.error("Error updating order status", { error: error.message });
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
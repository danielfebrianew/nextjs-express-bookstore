import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const router = express.Router();

// Zod schema untuk validasi input pada POST dan PUT
const orderItemSchema = z.object({
  orderId: z.string().uuid(), // Validasi orderId (UUID)
  bookId: z.string().uuid(),  // Validasi bookId (UUID)
  quantity: z.number().int().positive(), // Validasi quantity (angka positif)
});

const updateOrderItemSchema = z.object({
  quantity: z.number().int().positive(), // Validasi quantity untuk update (angka positif)
});

/**
 * Ambil detail satu order item berdasarkan ID
 */
router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    // Mencari order item berdasarkan ID
    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      logger.warn(`Order item not found for ID ${id}`);
      return res.status(404).json({ error: "Order item not found" });
    }

    logger.info(`Fetched order item for ID ${id}`);
    res.json(orderItem); // Mengembalikan detail order item
  } catch (error) {
    logger.error("Error fetching order item", { error: error.message });
    res.status(500).json({ error: "Failed to fetch order item" });
  }
});

/**
 * Ambil semua item dalam suatu pesanan berdasarkan orderId
 */
router.get("/order/:orderId", authenticateUser, async (req, res) => {
  const { orderId } = req.params;

  try {
    // Mencari semua item dalam pesanan berdasarkan orderId
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    logger.info(`Fetched all order items for order ID ${orderId}`);
    res.json(orderItems); // Mengembalikan semua item pesanan
  } catch (error) {
    logger.error("Error fetching order items", { error: error.message });
    res.status(500).json({ error: "Failed to fetch order items" });
  }
});

/**
 * Tambah item ke dalam pesanan (harga otomatis dari Book)
 */
router.post("/", authenticateUser, async (req, res) => {
  const parsedData = orderItemSchema.safeParse(req.body);

  // Validasi input menggunakan Zod
  if (!parsedData.success) {
    logger.error("Order item validation failed", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid input data", details: parsedData.error.errors });
  }

  const { orderId, bookId, quantity } = req.body;

  try {
    // Ambil harga buku dari database
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      logger.warn(`Book not found for ID ${bookId}`);
      return res.status(404).json({ error: "Book not found" });
    }

    // Buat item pesanan baru dengan harga buku yang ditemukan
    const newOrderItem = await prisma.orderItem.create({
      data: {
        orderId,
        bookId,
        quantity,
        price: book.price, // Harga dari tabel Book
      },
    });

    logger.info("Order item added successfully", { newOrderItem });
    res.status(201).json(newOrderItem); // Mengembalikan item yang baru ditambahkan
  } catch (error) {
    logger.error("Error adding order item", { error: error.message });
    res.status(500).json({ error: "Failed to add order item" });
  }
});

/**
 * Update jumlah item dalam pesanan berdasarkan ID
 */
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  const parsedData = updateOrderItemSchema.safeParse(req.body);

  // Validasi input quantity menggunakan Zod
  if (!parsedData.success) {
    logger.error("Invalid quantity input", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const { quantity } = req.body;

  try {
    // Mencari item pesanan berdasarkan ID
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) {
      logger.warn(`Order item not found for ID ${id}`);
      return res.status(404).json({ error: "Order item not found" });
    }

    // Update jumlah item pesanan
    const updatedOrderItem = await prisma.orderItem.update({
      where: { id },
      data: { quantity },
    });

    logger.info(`Order item updated successfully for ID ${id}`, { updatedOrderItem });
    res.json(updatedOrderItem); // Mengembalikan item yang telah diperbarui
  } catch (error) {
    logger.error("Error updating order item", { error: error.message });
    res.status(500).json({ error: "Failed to update order item" });
  }
});

/**
 * Hapus item dari pesanan berdasarkan ID
 */
router.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    // Mencari item pesanan berdasarkan ID
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) {
      logger.warn(`Order item not found for ID ${id}`);
      return res.status(404).json({ error: "Order item not found" });
    }

    // Hapus item pesanan
    await prisma.orderItem.delete({ where: { id } });

    logger.info(`Order item deleted successfully for ID ${id}`);
    res.json({ message: "Order item deleted successfully" }); // Konfirmasi penghapusan item
  } catch (error) {
    logger.error("Error deleting order item", { error: error.message });
    res.status(500).json({ error: "Failed to delete order item" });
  }
});

export default router;

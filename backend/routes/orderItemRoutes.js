import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Ambil detail satu order item berdasarkan ID
 */
router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
    });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found" });
    }

    res.json(orderItem);
  } catch (error) {
    console.error("Error fetching order item:", error);
    res.status(500).json({ error: "Failed to fetch order item" });
  }
});

/**
 * Ambil semua item dalam suatu pesanan
 */
router.get("/order/:orderId", authenticateUser, async (req, res) => {
  const { orderId } = req.params;

  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    res.json(orderItems);
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
});

/**
 * Tambah item ke dalam pesanan (harga otomatis dari Book)
 */
router.post("/", authenticateUser, async (req, res) => {
  const { orderId, bookId, quantity } = req.body;

  if (!orderId || !bookId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    // Ambil harga buku dari database
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Buat order item
    const newOrderItem = await prisma.orderItem.create({
      data: {
        orderId,
        bookId,
        quantity,
        price: book.price, // Harga dari tabel Book
      },
    });

    res.status(201).json(newOrderItem);
  } catch (error) {
    console.error("Error adding order item:", error);
    res.status(500).json({ error: "Failed to add order item" });
  }
});

/**
 * Update jumlah item dalam pesanan
 */
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  try {
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found" });
    }

    const updatedOrderItem = await prisma.orderItem.update({
      where: { id },
      data: { quantity },
    });

    res.json(updatedOrderItem);
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ error: "Failed to update order item" });
  }
});

/**
 * Hapus item dari pesanan
 */
router.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const orderItem = await prisma.orderItem.findUnique({ where: { id } });

    if (!orderItem) {
      return res.status(404).json({ error: "Order item not found" });
    }

    await prisma.orderItem.delete({ where: { id } });

    res.json({ message: "Order item deleted successfully" });
  } catch (error) {
    console.error("Error deleting order item:", error);
    res.status(500).json({ error: "Failed to delete order item" });
  }
});

export default router;

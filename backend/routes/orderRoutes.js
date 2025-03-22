import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Buat pesanan baru
router.post("/", authenticateUser, async (req, res) => {
    const { orderItems } = req.body;
  
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "Order must have at least one item" });
    }
  
    try {
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
  
      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order", details: error.message });
    }
  });
  

// Ambil semua pesanan user
router.get("/", authenticateUser, async (req, res) => {
    try {
      console.log("User ID:", req.user.id); // Logging user ID
  
      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: { orderItems: true },
      });
  
      console.log("Fetched Orders:", orders); // Logging hasil query
  
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error); // Logging error
      res.status(500).json({ error: "Failed to fetch orders", details: error.message });
    }
  });
  

// Ambil detail pesanan berdasarkan ID
router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update status pesanan
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["pending", "paid", "shipped", "completed"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;

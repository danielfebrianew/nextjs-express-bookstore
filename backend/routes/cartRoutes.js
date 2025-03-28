import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all cart items for the user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: { book: true },
    });
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve cart items" });
  }
});

router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await prisma.cart.findUnique({
      where: { id },
      include: { user: true, book: true } // Menyertakan detail user dan buku jika diperlukan
    });

    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve cart item" });
  }
});


// Add or update cart item
router.post("/", authenticateUser, async (req, res) => {
  const { bookId, quantity } = req.body;
  const userId = req.user.id; // Ambil userId dari middleware

  try {
    const existingCartItem = await prisma.cart.findFirst({
      where: { userId, bookId },
    });

    if (existingCartItem) {
      const updatedCart = await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
      return res.json(updatedCart);
    }

    const newCartItem = await prisma.cart.create({
      data: { userId, bookId, quantity },
    });

    res.status(201).json(newCartItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// Update cart item quantity
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const cartItem = await prisma.cart.findUnique({ where: { id } });

    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    const updatedCart = await prisma.cart.update({
      where: { id },
      data: { quantity },
    });

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// Remove cart item
router.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await prisma.cart.findUnique({ where: { id } });

    if (!cartItem || cartItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    await prisma.cart.delete({ where: { id } });

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

export default router;

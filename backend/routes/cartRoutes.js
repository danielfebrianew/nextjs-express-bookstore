import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const router = express.Router();

// Zod schema untuk validasi input pada POST dan PUT
const cartItemSchema = z.object({
  bookId: z.string().uuid(), // Validasi bookId sebagai UUID
  quantity: z.number().int().positive(), // Validasi quantity sebagai angka positif
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(), // Validasi quantity pada update sebagai angka positif
});

/**
 * Get all cart items for the user
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    // Log request
    logger.info(`Fetching all cart items for user ID ${req.user.id}`);

    const cartItems = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: { book: true },
    });

    logger.info("Fetched all cart items", { cartItemCount: cartItems.length });
    res.json(cartItems);
  } catch (error) {
    logger.error("Error fetching cart items", { error: error.message });
    res.status(500).json({ error: "Failed to retrieve cart items" });
  }
});

/**
 * Get cart item by ID for the user
 */
router.get("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await prisma.cart.findUnique({
      where: { id },
      include: { user: true, book: true }, // Include user and book details
    });

    if (!cartItem || cartItem.userId !== req.user.id) {
      logger.warn(`Cart item not found or unauthorized for user ID ${req.user.id}, cart item ID ${id}`);
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    logger.info(`Fetched cart item with ID ${id} for user ID ${req.user.id}`);
    res.json(cartItem);
  } catch (error) {
    logger.error("Error fetching cart item", { error: error.message });
    res.status(500).json({ error: "Failed to retrieve cart item" });
  }
});

/**
 * Add or update cart item
 */
router.post("/", authenticateUser, async (req, res) => {
  const parsedData = cartItemSchema.safeParse(req.body);

  // Validate input using Zod
  if (!parsedData.success) {
    logger.error("Invalid cart item input", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid input data", details: parsedData.error.errors });
  }

  const { bookId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const existingCartItem = await prisma.cart.findFirst({
      where: { userId, bookId },
    });

    if (existingCartItem) {
      const updatedCart = await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });

      logger.info("Updated cart item", { updatedCart });
      return res.json(updatedCart);
    }

    const newCartItem = await prisma.cart.create({
      data: { userId, bookId, quantity },
    });

    logger.info("Added new cart item", { newCartItem });
    res.status(201).json(newCartItem);
  } catch (error) {
    logger.error("Error adding item to cart", { error: error.message });
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

/**
 * Update cart item quantity
 */
router.put("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const parsedData = updateCartItemSchema.safeParse(req.body);

  // Validate input quantity using Zod
  if (!parsedData.success) {
    logger.error("Invalid quantity input", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const { quantity } = req.body;

  try {
    const cartItem = await prisma.cart.findUnique({ where: { id } });

    if (!cartItem || cartItem.userId !== req.user.id) {
      logger.warn(`Cart item not found or unauthorized for user ID ${req.user.id}, cart item ID ${id}`);
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    const updatedCart = await prisma.cart.update({
      where: { id },
      data: { quantity },
    });

    logger.info(`Updated cart item with ID ${id} for user ID ${req.user.id}`, { updatedCart });
    res.json(updatedCart);
  } catch (error) {
    logger.error("Error updating cart item", { error: error.message });
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

/**
 * Remove cart item
 */
router.delete("/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await prisma.cart.findUnique({ where: { id } });

    if (!cartItem || cartItem.userId !== req.user.id) {
      logger.warn(`Cart item not found or unauthorized for user ID ${req.user.id}, cart item ID ${id}`);
      return res.status(404).json({ error: "Cart item not found or unauthorized" });
    }

    await prisma.cart.delete({ where: { id } });

    logger.info(`Removed cart item with ID ${id} for user ID ${req.user.id}`);
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    logger.error("Error removing cart item", { error: error.message });
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

export default router;

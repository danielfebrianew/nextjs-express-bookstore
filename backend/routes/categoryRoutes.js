import express from "express";
import prisma from "../prismaClient.js";
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const router = express.Router();

// Zod schema untuk validasi ID kategori
const categoryIdSchema = z.object({
  id: z.string().uuid(), // Validasi ID kategori sebagai UUID
});

/**
 * Get all categories (Public)
 */
router.get("/", async (req, res) => {
  try {
    // Log request
    logger.info("Fetching all categories");

    const categories = await prisma.category.findMany();
    logger.info("Fetched all categories", { categoryCount: categories.length });

    res.json(categories);
  } catch (error) {
    logger.error("Error fetching categories", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get category by ID (Public)
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Validasi ID kategori menggunakan Zod
  const parsedData = categoryIdSchema.safeParse({ id });
  if (!parsedData.success) {
    logger.error("Invalid category ID", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid category ID format", details: parsedData.error.errors });
  }

  try {
    // Log request
    logger.info(`Fetching category with ID ${id}`);

    const category = await prisma.category.findUnique({
      where: { id },
      include: { books: true }, // Menampilkan buku dalam kategori ini
    });

    if (!category) {
      logger.warn(`Category not found for ID ${id}`);
      return res.status(404).json({ error: "Category not found" });
    }

    logger.info(`Fetched category with ID ${id}`, { category });
    res.json(category);
  } catch (error) {
    logger.error("Error fetching category by ID", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

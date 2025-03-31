import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const router = express.Router();

// Zod schema untuk validasi input kategori
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"), // Validasi name kategori (tidak boleh kosong)
});

/**
 * Create category (Admin only)
 */
router.post("/", authenticateUser, authorizeAdmin, async (req, res) => {
  const parsedData = categorySchema.safeParse(req.body);

  // Validasi input menggunakan Zod
  if (!parsedData.success) {
    logger.error("Invalid category data", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid category data", details: parsedData.error.errors });
  }

  const { name } = req.body;

  try {
    // Log request
    logger.info("Creating new category", { name });

    const category = await prisma.category.create({
      data: { name },
    });

    logger.info("Category created successfully", { category });
    res.status(201).json(category);
  } catch (error) {
    logger.error("Error creating category", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update category (Admin only)
 */
router.put("/:id", authenticateUser, authorizeAdmin, async (req, res) => {
  const { name } = req.body;
  
  // Validasi input menggunakan Zod
  const parsedData = categorySchema.safeParse({ name });
  if (!parsedData.success) {
    logger.error("Invalid category update data", { errors: parsedData.error.errors });
    return res.status(400).json({ error: "Invalid category data", details: parsedData.error.errors });
  }

  try {
    // Log request
    logger.info(`Updating category with ID ${req.params.id}`, { name });

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
    });

    logger.info(`Category updated successfully for ID ${req.params.id}`, { category });
    res.json(category);
  } catch (error) {
    logger.error("Error updating category", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete category (Admin only)
 */
router.delete("/:id", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    // Log request
    logger.info(`Deleting category with ID ${req.params.id}`);

    await prisma.category.delete({ where: { id: req.params.id } });

    logger.info(`Category with ID ${req.params.id} deleted successfully`);
    res.json({ message: "Category deleted" });
  } catch (error) {
    logger.error("Error deleting category", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// ✅ Get all categories (Public)
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get category by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { books: true }, // Opsional: Menampilkan buku dalam kategori ini
    });

    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

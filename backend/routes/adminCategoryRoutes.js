import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create category (Admin only)
router.post("/", authenticateUser, authorizeAdmin, async (req, res) => {
    const { name } = req.body;
  
    try {
      const category = await prisma.category.create({ data: { name } });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ✅ Update category (Admin only)
  router.put("/:id", authenticateUser, authorizeAdmin, async (req, res) => {
    const { name } = req.body;
  
    try {
      const category = await prisma.category.update({
        where: { id: req.params.id },
        data: { name },
      });
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ✅ Delete category (Admin only)
  router.delete("/:id", authenticateUser, authorizeAdmin, async (req, res) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

export default router;
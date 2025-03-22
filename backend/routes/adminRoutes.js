import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Get all users (Admin only)
router.get("/users", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user (Admin only)
router.put("/users/:id", authenticateUser, authorizeAdmin, upload.single("idCardImage"), async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
          return res.status(404).json({ error: "User not found" });
      }

      let idCardImage = existingUser.idCardImage;
      if (req.file) {
          idCardImage = req.file.path; // URL dari Cloudinary
      }

      const updatedUser = await prisma.user.update({
          where: { id },
          data: { name, email, role, idCardImage },
      });

      res.json({ message: "User updated", user: updatedUser });
  } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
  }
});

// Delete user (Admin only)
router.delete("/users/:id", authenticateUser, authorizeAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete user" });
  }
});

// Upload Card ID (User Only)
router.put('/upload-card', authenticateUser, upload.single("cardId"), async (req, res) => {
    const cardIdUrl = req.file?.path; // Dapatkan URL dari Cloudinary
  
    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { cardId: cardIdUrl },
      });
      res.json({ message: "Card ID uploaded successfully", cardIdUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

export default router;

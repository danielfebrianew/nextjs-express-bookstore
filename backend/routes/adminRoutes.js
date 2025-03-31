import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";
import { z } from 'zod';
import logger from '../utils/logger.js';  // Menggunakan logger dari utils/logger.js

const router = express.Router();

// Schema validation dengan Zod
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"], "Invalid role"),
});

const uploadCardSchema = z.object({
  cardId: z.string().min(1, "Card ID is required")
});

// Get all users (Admin only)
router.get("/users", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    logger.info('Fetched all users.');
    res.json(users);
  } catch (error) {
    logger.error(`Failed to fetch users: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user (Admin only)
router.put("/users/:id", authenticateUser, authorizeAdmin, upload.single("idCardImage"), async (req, res) => {
  try {
    // Validate body using Zod
    updateUserSchema.parse(req.body);
    
    const { id } = req.params;
    const { name, email, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let idCardImage = existingUser.idCardImage;
    if (req.file) {
      idCardImage = req.file.path; // URL from Cloudinary
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, role, idCardImage },
    });

    logger.info(`User ${id} updated successfully.`);
    res.json({ message: "User updated", user: updatedUser });
  } catch (error) {
    logger.error(`Failed to update user: ${error.message}`);
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
    logger.info(`User ${id} deleted successfully.`);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error(`Failed to delete user ${id}: ${error.message}`);
    res.status(400).json({ error: "Failed to delete user" });
  }
});

// Upload Card ID (User Only)
router.put('/upload-card', authenticateUser, upload.single("cardId"), async (req, res) => {
  try {
    // Validate file using Zod
    uploadCardSchema.parse({ cardId: req.file?.path });

    const cardIdUrl = req.file?.path; // Get URL from Cloudinary

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { cardId: cardIdUrl },
    });

    logger.info(`Card ID uploaded for user ${req.user.id}`);
    res.json({ message: "Card ID uploaded successfully", cardIdUrl });
  } catch (error) {
    logger.error(`Failed to upload card ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;

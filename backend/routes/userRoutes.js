import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, idCardImage } = req.body;

    // Validasi input tidak boleh kosong
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Cek apakah email atau phone sudah digunakan
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone.startsWith("+62") ? phone : `+62${phone}` }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email or phone number already in use" });
    }

    // Hash password sebelum menyimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone.startsWith("+62") ? phone : `+62${phone}`,
        idCardImage,
        role: "user",
      },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(400).json({ message: "Invalid email or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.cookie("token", token, {
    httpOnly: true, // Tidak bisa diakses dari JavaScript
    secure: process.env.NODE_ENV === "production", // Hanya HTTPS di production
    sameSite: "strict", // Mencegah CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  });

  res.json({ message: "Login successful", token });
});

// Get User Profile (Authenticated User)
router.get("/profile", authenticateUser, async (req, res) => {
  res.json(req.user);
});

// Logout (Handled on frontend by deleting token)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

export default router;

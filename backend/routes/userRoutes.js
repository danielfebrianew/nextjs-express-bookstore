import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { z } from 'zod';
import logger from "../utils/logger.js";
import libphonenumber from "google-libphonenumber";
import { upload } from "../config/cloudinary.js";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const PhoneNumberFormat = libphonenumber.PhoneNumberFormat;

dotenv.config();

// Check if JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  logger.warn("Warning: JWT_SECRET is not defined in environment variables. This may lead to security issues.");
}

const router = express.Router();

// Zod schema for validation
const registerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).transform((name) => name.trim()),
  email: z.string().email({ message: "Invalid email address" }).transform((email) => email.toLowerCase().trim()),
  password: z.string().min(4, { message: "Password must be at least 6 characters" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  profilePicture: z.string().url({ message: "Invalid URL format for ID Card Image" }).optional(),
  role: z.enum(["admin", "user"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).transform((email) => email.toLowerCase().trim()),
  password: z.string().min(4, { message: "Password must be at least 6 characters" }),
});

// Helper function for phone number validation using libphonenumber
const validatePhoneNumber = (phone) => {
  const phoneNumber = phoneUtil.parseAndKeepRawInput(phone, "ID");

  if (!phoneUtil.isValidNumber(phoneNumber)) {
    throw new Error("Invalid phone number");
  }

  return phoneUtil.format(phoneNumber, PhoneNumberFormat.E164); // ✅ Ini baru benar
};

// Register User
router.post("/register", async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    logger.info(`Register request received ${JSON.stringify(req.body)}`);
    if (!result.success) {
      // Log specific validation errors for each field
      const errors = result.error.errors.map(error => {
        return `Field: ${error.path[0]}, Message: ${error.message}`;
      });
      logger.warn("Validation failed for registration: " + errors.join(", "));
      return res.status(400).json({ error: errors.join(", ") });
    }

    const { name, email, password, phone, profilePicture } = req.body;

    // Validate and sanitize phone number
    let sanitizedPhone;
    try {
      sanitizedPhone = validatePhoneNumber(phone);
    } catch (error) {
      logger.error("Phone validation failed: " + error.message);
      return res.status(400).json({ error: error.message });
    }

    // Check if email or phone is already in use
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: sanitizedPhone }
        ]
      }
    });

    if (existingUser) {
      logger.warn(`Registration failed: Email or phone number already in use for email: ${email}, phone: ${sanitizedPhone}`);
      return res.status(400).json({ error: "Email or phone number already in use" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12); // Salt round increased

    const allowedRoles = ["admin", "user"];
    const role = allowedRoles.includes(req.body.role) ? req.body.role : "user";

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: sanitizedPhone,
        profilePicture,
        role: role,
      },
    });

    logger.info(`User registered successfully: ${user.email}`);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    logger.error("Error registering user: " + error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      logger.warn("Validation failed for login: " + result.error.errors[0].message);
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn("Login failed: Invalid email or password for email: " + email);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("Login failed: Invalid password for email: " + email);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // Set appropriate path for cookie
    });

    logger.info(`User logged in successfully: ${user.email}`);
    res.json({ message: "Login successful", token });
  } catch (error) {
    logger.error("Error logging in user: " + error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get user profile (Private)
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, profilePicture: true, phone: true },
    });

    if (!user) {
      logger.warn("User not found: " + req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Error fetching user profile: " + error.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
router.put(
  "/profile",
  authenticateUser,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { name, phone } = req.body;

      // Validasi dan sanitize nomor telepon jika ada
      let sanitizedPhone;
      if (phone) {
        try {
          sanitizedPhone = validatePhoneNumber(phone);
        } catch (error) {
          logger.warn("Phone validation failed: " + error.message);
          return res.status(400).json({ error: error.message });
        }
      }

      // Upload gambar baru jika ada
      let profilePicture;
      if (req.file) {
        profilePicture = req.file.path; // path dari Cloudinary upload
      }

      // Update data di database
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name?.trim(),
          phone: sanitizedPhone,
          profilePicture: profilePicture,
        },
      });

      logger.info(`User updated: ${updatedUser.email}`);
      res.json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
      logger.error("Error updating profile: " + error.message);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Logout (Handled on frontend by deleting token)
router.post("/logout", (req, res) => {
  res.clearCookie("token"); // Clear the token on logout
  logger.info("User logged out successfully");
  res.json({ message: "Logged out" });
});

// Validate JWT Token
router.get("/validate-token", authenticateUser, (req, res) => {
  res.status(200).json({ valid: true, userId: req.user.id });
});


export default router;

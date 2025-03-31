import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { z } from 'zod'; 
import logger from "../utils/logger.js"; 
import phoneUtil from 'google-libphonenumber'; // Import libphonenumber untuk sanitasi phone number

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
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phone: z.string().min(1, { message: "Phone number is required" }).transform((phone) => phone.replace(/\s+/g, '')),
  idCardImage: z.string().url({ message: "Invalid URL format for ID Card Image" }).optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).transform((email) => email.toLowerCase().trim()),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Helper function for phone number validation using libphonenumber
const validatePhoneNumber = (phone) => {
  const phoneNumber = phoneUtil.parseAndKeepRawInput(phone, 'ID'); // ID for Indonesia
  if (!phoneUtil.isValidNumber(phoneNumber)) {
    throw new Error('Invalid phone number');
  }
  return phoneUtil.format(phoneNumber, phoneUtil.PhoneNumberFormat.E164); // Format to +62xxxx
};

// Register User
router.post("/register", xss(), async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      logger.warn("Validation failed for registration: " + result.error.errors[0].message);
      return res.status(400).json({ error: result.error.errors[0].message });
    }

    const { name, email, password, phone, idCardImage } = req.body;

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

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: sanitizedPhone,
        idCardImage,
        role: "user",
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
      domain: "yourdomain.com", // Secure cookie domain
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
router.get("/users/profile", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      logger.warn("User not found: " + req.user.userId);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Error fetching user profile: " + error.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Logout (Handled on frontend by deleting token)
router.post("/logout", (req, res) => {
  res.clearCookie("token"); // Clear the token on logout
  logger.info("User logged out successfully");
  res.json({ message: "Logged out" });
});

export default router;

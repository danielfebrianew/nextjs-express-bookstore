import jwt from "jsonwebtoken";
import prisma from '../prismaClient.js';
import logger from "../utils/logger.js"; // Import winston logger
import { z } from "zod"; // Import Zod for validation

const { verify } = jwt;

// Zod schema untuk memvalidasi token
const tokenSchema = z.object({
  token: z.string().min(1, "Token must be provided").regex(/^Bearer\s[^\s]+$/, "Token format is invalid"), // Validasi format token
});

// Middleware untuk memeriksa apakah user terautentikasi
const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization;

  // Validasi token dengan Zod
  const parsedToken = tokenSchema.safeParse({ token });
  if (!parsedToken.success) {
    logger.error("Token validation failed", { errors: parsedToken.error.errors });
    return res.status(401).json({ message: 'Access Denied', details: parsedToken.error.errors });
  }

  if (!token) {
    logger.warn("Token not provided");
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    
    req.user = await prisma.user.findUnique({ 
      where: { id: decoded.id }, 
      include: { addresses: true } 
    });
    if (!req.user) {
      logger.warn("User not found", { userId: decoded.id });
      return res.status(401).json({ message: 'User not found' });
    }

    logger.info("User authenticated successfully", { userId: req.user.id });
    next();
  } catch (error) {
    logger.error("Error during token verification", { error: error.message });
    res.status(401).json({ message: 'Invalid Token' });
  }
};

// Middleware untuk mengizinkan hanya admin
const authorizeAdmin = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization;

  // Validasi token dengan Zod
  const parsedToken = tokenSchema.safeParse({ token });
  if (!parsedToken.success) {
    logger.error("Token validation failed", { errors: parsedToken.error.errors });
    return res.status(401).json({ message: 'Access Denied', details: parsedToken.error.errors });
  }

  if (!token) {
    logger.warn("Token not provided");
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    const decoded = verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({ 
      where: { id: decoded.id }, 
      include: { addresses: true } 
    });
    if (!req.user) {
      logger.warn("User not found", { userId: decoded.id });
      return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.role !== 'admin') {
      logger.warn("Access denied for non-admin user", { userId: req.user.id });
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    logger.info("Admin authorization successful", { userId: req.user.id });
    next();
  } catch (error) {
    logger.error("Error during token verification", { error: error.message });
    res.status(401).json({ message: 'Invalid Token' });
  }
};

export { authenticateUser, authorizeAdmin };

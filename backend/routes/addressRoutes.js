import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import logger from "../utils/logger.js";
import { z } from "zod";

const router = express.Router();

// Zod schema for address validation
const addressSchema = z.object({
  street: z.string().min(3, "Street is required and must be at least 3 characters."),
  district: z.string().min(3, "District is required and must be at least 3 characters."),
  city: z.string().min(2, "City is required."),
  province: z.string().min(2, "Province is required."),
  zip: z.string().min(4).max(10, "Zip must be 4-10 characters."),
  isDefault: z.boolean().optional()
});

// Middleware for validating request body with Zod
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    logger.warn("Validation failed: " + JSON.stringify(err.errors));
    return res.status(400).json({ error: err.errors });
  }
};

// Helper: Reset default address
const resetDefaultAddress = async (userId) => {
  await prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false }
  });
};

// Helper: Check address ownership
const checkOwnership = async (addressId, userId) => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address) return { status: 404, message: "Address not found" };
  if (address.userId !== userId) return { status: 403, message: "Access denied" };
  return { status: 200, data: address };
};

// Create Address
router.post('/', authenticateUser, validate(addressSchema), async (req, res) => {
  try {
    const userId = req.user.id;
    const { street, district, city, province, zip, isDefault } = req.body;

    if (isDefault) await resetDefaultAddress(userId);

    const address = await prisma.address.create({
      data: { userId, street, district, city, province, zip, isDefault },
    });

    logger.info(`Address created for user ${userId}`);
    res.status(201).json(address);
  } catch (error) {
    logger.error("Failed to create address: " + error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all addresses for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
    });
    res.json(addresses);
  } catch (error) {
    logger.error("Failed to retrieve addresses: " + error.message);
    res.status(500).json({ error: 'Failed to retrieve addresses' });
  }
});

// Get address by ID (with ownership check)
router.get('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const check = await checkOwnership(id, req.user.id);
  if (check.status !== 200) {
    logger.warn(`Unauthorized access attempt by user ${req.user.id} to address ${id}`);
    return res.status(check.status).json({ error: check.message });
  }

  res.json(check.data);
});

// Update address by ID (with ownership check)
router.put('/:id', authenticateUser, validate(addressSchema), async (req, res) => {
  const { id } = req.params;
  const { street, district, city, province, zip, isDefault } = req.body;

  const check = await checkOwnership(id, req.user.id);
  if (check.status !== 200) {
    logger.warn(`Unauthorized update attempt by user ${req.user.id} to address ${id}`);
    return res.status(check.status).json({ error: check.message });
  }

  if (isDefault) await resetDefaultAddress(req.user.id);

  try {
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: { street, district, city, province, zip, isDefault },
    });
    logger.info(`Address ${id} updated by user ${req.user.id}`);
    res.json(updatedAddress);
  } catch (error) {
    logger.error("Failed to update address: " + error.message);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete address by ID (with ownership check)
router.delete('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const check = await checkOwnership(id, req.user.id);
  if (check.status !== 200) {
    logger.warn(`Unauthorized delete attempt by user ${req.user.id} to address ${id}`);
    return res.status(check.status).json({ error: check.message });
  }

  if (check.data.isDefault) {
    logger.warn(`Attempt to delete default address by user ${req.user.id}`);
    return res.status(400).json({ error: "Cannot delete default address" });
  }

  try {
    await prisma.address.delete({ where: { id } });
    logger.info(`Address ${id} deleted by user ${req.user.id}`);
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete address: " + error.message);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;

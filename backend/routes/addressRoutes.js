import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Address
router.post('/', authenticateUser, async (req, res) => {
    try {
        console.log("Request Body:", req.user);
        const userId = req.user.id;
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        const { street, district, city, province, zip, isDefault } = req.body;
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }
        const address = await prisma.address.create({
            data: { userId, street, district, city, province, zip, isDefault },
        });
        res.status(201).json(address);
    }catch (error) {
        console.error("Failed to create address. Error details:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all addresses
router.get('/', async (req, res) => {
    try {
        const addresses = await prisma.address.findMany();
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve addresses' });
    }
});

// Get address by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const address = await prisma.address.findUnique({
            where: { id },
        });
        if (!address) return res.status(404).json({ error: 'Address not found' });
        res.json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve address' });
    }
});

// Update address by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { street, district, city, province, zip, isDefault } = req.body;
        if (isDefault) {
            const addressToUpdate = await prisma.address.findUnique({ where: { id } });
            if (addressToUpdate) {
                await prisma.address.updateMany({
                    where: { userId: addressToUpdate.userId },
                    data: { isDefault: false }
                });
            }
        }
        const address = await prisma.address.update({
            where: { id },
            data: { street, district, city, province, zip, isDefault },
        });
        res.json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// Delete address by ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      // Cari alamat berdasarkan ID
      const existingAddress = await prisma.address.findUnique({ where: { id } });
  
      // Jika alamat tidak ditemukan
      if (!existingAddress) {
        return res.status(404).json({ error: "Address not found" });
      }
  
      // Logging untuk debug
      console.log(`Address ID: ${id}, isDefault: ${existingAddress.isDefault}`);
  
      // Cek apakah alamat ini adalah default
      if (existingAddress.isDefault) {
        return res.status(400).json({ error: "Cannot delete default address" });
      }
  
      // Hapus alamat jika bukan default
      await prisma.address.delete({ where: { id } });
  
      res.json({ message: "Address deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

export default router;

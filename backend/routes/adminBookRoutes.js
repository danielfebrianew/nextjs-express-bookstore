import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Create book (Admin only) with image upload
router.post('/', authenticateUser, authorizeAdmin, upload.single("imageUrl"), async (req, res) => {
    const { title, author, price, stock, categoryId } = req.body;
    const imageUrl = req.file?.path; // Dapatkan URL dari Cloudinary

    try {
        const book = await prisma.book.create({
            data: {
                title,
                author,
                price: parseInt(price, 10), // Konversi ke Integer
                stock: parseInt(stock, 10), // Konversi ke Integer
                categoryId,
                imageUrl: imageUrl
            },
        });

        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update book (Admin only) with image upload
router.put('/:id', authenticateUser, authorizeAdmin, upload.single("imageUrl"), async (req, res) => {
    const { title, author, price, stock, categoryId } = req.body;
    const bookId = req.params.id;

    try {
        // Cek apakah buku dengan ID ini ada
        const existingBook = await prisma.book.findUnique({ where: { id: bookId } });

        if (!existingBook) {
            return res.status(404).json({ error: "Book not found" });
        }

        let imageUrl = existingBook.imageUrl;

        // Jika ada file baru diunggah, gunakan URL baru tanpa menghapus yang lama
        if (req.file) {
            imageUrl = req.file.path;
        }

        // Update buku dengan data baru
        const updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: {
                title: title || existingBook.title,
                author: author || existingBook.author,
                price: price ? parseInt(price, 10) : existingBook.price,
                stock: stock ? parseInt(stock, 10) : existingBook.stock,
                categoryId: categoryId || existingBook.categoryId,
                imageUrl
            },
        });

        res.json(updatedBook);
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete book (Admin only)
router.delete('/:id', authenticateUser, authorizeAdmin, async (req, res) => {
    try {
        await prisma.book.delete({ where: { id: req.params.id } });
        res.json({ message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

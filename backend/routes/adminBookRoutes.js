import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser, authorizeAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";
import { z } from "zod";
import logger from "../utils/logger.js";

const router = express.Router();

// Zod schema for book validation (strict)
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  price: z.string()
    .regex(/^\d+$/, "Price must be a number")
    .refine((val) => parseInt(val, 10) > 0, {
      message: "Price must be greater than 0"
    }),
  stock: z.string()
    .regex(/^\d+$/, "Stock must be a number")
    .refine((val) => parseInt(val, 10) >= 0, {
      message: "Stock must be a non-negative number"
    }),
  categoryId: z.string().uuid("Invalid category ID")
});

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    logger.warn("Validation failed: " + JSON.stringify(err.errors));
    return res.status(400).json({ error: err.errors });
  }
};

// Create book (Admin only) with image upload
router.post('/', authenticateUser, authorizeAdmin, upload.single("imageUrl"), validate(bookSchema), async (req, res) => {
  const { title, author, price, stock, categoryId } = req.body;
  const imageUrl = req.file?.path;

  try {
    const book = await prisma.book.create({
      data: {
        title,
        author,
        price: parseInt(price, 10),
        stock: parseInt(stock, 10),
        categoryId,
        imageUrl
      },
    });

    logger.info(`Book created: ${book.id}`);
    res.status(201).json(book);
  } catch (error) {
    logger.error("Failed to create book: " + error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update book (Admin only) with image upload
router.put('/:id', authenticateUser, authorizeAdmin, upload.single("imageUrl"), validate(bookSchema.partial()), async (req, res) => {
  const { title, author, price, stock, categoryId } = req.body;
  const bookId = req.params.id;

  try {
    const existingBook = await prisma.book.findUnique({ where: { id: bookId } });

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    let imageUrl = existingBook.imageUrl;
    if (req.file) {
      imageUrl = req.file.path;
    }

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

    logger.info(`Book updated: ${bookId}`);
    res.json(updatedBook);
  } catch (error) {
    logger.error("Error updating book: " + error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete book (Admin only)
router.delete('/:id', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    logger.info(`Book deleted: ${req.params.id}`);
    res.json({ message: 'Book deleted' });
  } catch (error) {
    logger.error("Failed to delete book: " + error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

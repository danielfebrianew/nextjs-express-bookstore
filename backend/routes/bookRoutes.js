import express from "express";
import prisma from "../prismaClient.js";
import logger from "../utils/logger.js"; // Import logger yang sudah pake winston
import { z } from 'zod';

const router = express.Router();

// Utility function for safe pagination values
const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size) || 10, 1), 100);
  const skip = (page - 1) * size;
  return { page, size, skip };
};

// Zod validation schema untuk query params di search
const searchQuerySchema = z.object({
  q: z.string().min(1, { message: "Query parameter 'q' diperlukan" }), // Validasi parameter q
  page: z.number().int().min(1).optional(), // Halaman yang opsional dan minimal 1
  size: z.number().int().min(1).max(100).optional(), // Ukuran halaman yang opsional dan minimal 1, maksimal 100
});

// Get all books (Public) dengan pagination
router.get("/", async (req, res) => {
  try {
    const { page, size, skip } = parsePagination(req);

    const books = await prisma.book.findMany({ skip, take: size });
    const total = await prisma.book.count();
    const totalPages = Math.ceil(total / size);

    res.json({ total, page, size, totalPages, results: books });
  } catch (error) {
    logger.error("Error fetching books: " + error.message);
    res.status(500).json({ error: "Gagal mengambil buku" });
  }
});

// Pencarian buku berdasarkan query params
router.get("/search", async (req, res) => {
  logger.info("API /books/search dipanggil dengan query: " + req.query.q);

  // Validasi dengan Zod
  try {
    searchQuerySchema.parse(req.query); // Cek apakah query valid
  } catch (e) {
    logger.warn("Validasi query gagal: " + e.errors[0].message);
    return res.status(400).json({ error: e.errors[0].message });
  }

  const { q } = req.query;
  const { page, size, skip } = parsePagination(req);

  try {
    const filter = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ],
    };

    const books = await prisma.book.findMany({ where: filter, skip, take: size });
    const total = await prisma.book.count({ where: filter });
    const totalPages = Math.ceil(total / size);

    res.json({ total, page, size, totalPages, results: books });
  } catch (error) {
    logger.error("Error mencari buku: " + error.message);
    res.status(500).json({ error: "Gagal mencari buku: " + error.message });
  }
});

// Get book by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Parameter ID diperlukan" });
    }

    const book = await prisma.book.findUnique({ where: { id } });

    if (!book) {
      logger.warn("Buku tidak ditemukan dengan ID: " + id);
      return res.status(404).json({ error: "Buku tidak ditemukan" });
    }

    res.json(book);
  } catch (error) {
    logger.error("Error fetching book by ID: " + error.message);
    res.status(500).json({ error: "Gagal mengambil buku" });
  }
});

export default router;

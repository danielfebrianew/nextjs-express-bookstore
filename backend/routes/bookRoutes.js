import express from "express";
import prisma from "../prismaClient.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all books (Public) dengan pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const books = await prisma.book.findMany({
      skip,
      take: size,
    });

    const total = await prisma.book.count();

    res.json({
      total,
      page,
      size,
      results: books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Gagal mengambil buku" });
  }
});

// Pencarian buku berdasarkan query params
router.get("/search", async (req, res) => {
  console.log("API /books/search dipanggil dengan query:", req.query.q);

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' diperlukan" });
  }

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const skip = (page - 1) * size;

  try {
    // Pencarian menggunakan Prisma (removed description field)
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      skip,
      take: size,
    });

    const total = await prisma.book.count({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
    });

    return res.json({ total, page, size, results: books });
  } catch (error) {
    console.error("Error mencari buku:", error);
    res.status(500).json({ error: "Gagal mencari buku: " + error.message });
  }
});

router.get("/users/profile", authenticateUser, async (req, res) => {
  const user = await user.findById(req.user.userId).select("-password");
  res.json(user);
});

// Get book by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
    });

    if (!book) {
      return res.status(404).json({ error: "Buku tidak ditemukan" });
    }

    res.json(book);
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    res.status(500).json({ error: "Gagal mengambil buku" });
  }
});

export default router;

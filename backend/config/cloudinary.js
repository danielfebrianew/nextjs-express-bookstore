import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import path from "path"; // Import path untuk mengelola ekstensi file

dotenv.config(); // Load environment variables

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Daftar format gambar yang diizinkan
const allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/avif", "image/webp"];

// Konfigurasi penyimpanan Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (!allowedFormats.includes(file.mimetype)) {
      throw new Error("Format file tidak didukung");
    }

    // Ambil nama file tanpa ekstensi
    const fileNameWithoutExt = path.parse(file.originalname).name;

    // Tentukan folder berdasarkan field yang digunakan di form-data
    let folder = "bookstore"; // Default folder

    if (file.fieldname === "idCardImage") {
      folder = "id_cards"; // Folder khusus untuk kartu identitas
    } else if (file.fieldname === "imageUrl") {
      folder = "books"; // Folder khusus untuk buku
    }

    return {
      folder: folder,
      format: file.mimetype.split("/")[1], // Gunakan format asli file
      public_id: `${Date.now()}-${fileNameWithoutExt}`, // Hindari duplikasi ekstensi
    };
  },
});

// Middleware upload menggunakan Multer
const upload = multer({ storage });

export { cloudinary, upload };

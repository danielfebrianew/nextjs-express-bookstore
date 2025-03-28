import express from "express";
import axios from "axios";
import midtransClient from "midtrans-client";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import qs from "qs"; // Untuk format x-www-form-urlencoded

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// Midtrans Config
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// RajaOngkir Config
const RAJAONGKIR_API_URL = "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost";

router.post("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const { shippingCode, shippingService } = req.body;
    if (!shippingCode || !shippingService) {
      return res.status(400).json({ message: "Shipping details are required" });
    }

    // 🔹 Ambil data user dan alamat default
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: { where: { isDefault: true } }, carts: { include: { book: true } } }
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.carts.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const defaultAddress = user.addresses.find(addr => addr.isDefault);
    if (!defaultAddress) return res.status(400).json({ message: "No default address found" });

    // 🔹 Hit RajaOngkir untuk mendapatkan semua opsi pengiriman
    const shippingData = qs.stringify({
      origin: "31555",
      destination: defaultAddress.zip,
      weight: user.carts.length * 500,
      courier: "jne:sicepat:jnt"
    });

    const shippingResponse = await axios.post(RAJAONGKIR_API_URL, shippingData, {
      headers: {
        "key": process.env.RAJAONGKIR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!shippingResponse.data || !shippingResponse.data.data) {
      throw new Error("Invalid response from RajaOngkir");
    }

    // 🔹 Cari shippingCost berdasarkan shippingCode dan shippingService
    const shippingOption = shippingResponse.data.data.find(option =>
      option.code === shippingCode && option.service === shippingService
    );

    if (!shippingOption) {
      return res.status(400).json({ message: "Invalid shipping option selected" });
    }

    const shippingCost = shippingOption.cost;
    const shippingCourier = shippingOption.name;

    // 🔹 Hitung total harga produk dari cart
    const itemDetails = user.carts.map(cart => ({
      id: cart.bookId,
      name: cart.book.title,
      price: cart.book.price,
      quantity: cart.quantity
    }));

    const totalItemPrice = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = totalItemPrice + shippingCost;

    // 🔹 Buat order di database
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        shippingCost,
        status: "pending",
        orderItems: {
          create: user.carts.map(cart => ({
            bookId: cart.bookId,
            quantity: cart.quantity,
            price: cart.book.price
          }))
        }
      }
    });

    // 🔹 Midtrans Transaction
    const transactionParams = {
      transaction_details: { order_id: order.id, gross_amount: totalAmount },
      item_details: [
        ...itemDetails,
        { id: "SHIPPING", name: `Shipping (${shippingCourier})`, price: shippingCost, quantity: 1 }
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone,
        address: defaultAddress.street,
        city: defaultAddress.city,
        zip: defaultAddress.zip
      },
      credit_card: { secure: true }
    };

    const transaction = await snap.createTransaction(transactionParams);

    // 🔹 Simpan token pembayaran ke order
    await prisma.order.update({
      where: { id: order.id },
      data: { shippingTrackingId: transaction.token }
    });

    // 🔹 Kosongkan cart setelah checkout
    await prisma.cart.deleteMany({ where: { userId } });

    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });

  } catch (error) {
    console.error("Checkout Error:", error.message);
    res.status(500).json({ message: "Checkout failed", error: error.message });
  }
});


router.get("/shipping-options", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: { where: { isDefault: true } } }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const defaultAddress = user.addresses.find(addr => addr.isDefault);
    if (!defaultAddress) return res.status(400).json({ message: "No default address found" });

    // 🔹 Hit API RajaOngkir untuk semua opsi pengiriman
    const shippingData = qs.stringify({
      origin: "31555", // Sesuaikan dengan kode asal toko
      destination: defaultAddress.zip,
      weight: 1000, // Misal 1kg, bisa dinamis
      courier: "jne:sicepat:jnt"
    });

    const shippingResponse = await axios.post(RAJAONGKIR_API_URL, shippingData, {
      headers: {
        "key": process.env.RAJAONGKIR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!shippingResponse.data || !shippingResponse.data.data) {
      throw new Error("Invalid response from RajaOngkir");
    }

    res.json({ shippingOptions: shippingResponse.data.data });

  } catch (error) {
    console.error("Shipping Options Error:", error.message);
    res.status(500).json({ message: "Failed to fetch shipping options", error: error.message });
  }
});


export default router;

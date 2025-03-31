import express from "express";
import axios from "axios";
import midtransClient from "midtrans-client";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import qs from "qs";
import logger from "../utils/logger.js"; // Import logger

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

const RAJAONGKIR_API_URL = "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost";

// Middleware logging untuk semua request
router.use((req, res, next) => {
  logger.info(`[REQ] ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
  next();
});

router.post("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`🔐 Authenticated user ID: ${userId}`);

    const { shippingCode, shippingService } = req.body;
    if (!shippingCode || !shippingService) {
      logger.warn("❗ Missing shipping details");
      return res.status(400).json({ message: "Shipping details are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: { where: { isDefault: true } },
        carts: { include: { book: true } }
      }
    });

    if (!user) {
      logger.warn("❗ User not found");
      return res.status(404).json({ message: "User not found" });
    }
    if (user.carts.length === 0) {
      logger.warn("🛒 Cart is empty");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const defaultAddress = user.addresses.find(addr => addr.isDefault);
    if (!defaultAddress) {
      logger.warn("📭 No default address found");
      return res.status(400).json({ message: "No default address found" });
    }

    logger.info(`📦 Requesting shipping cost for ${shippingCode} - ${shippingService}`);
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

    if (!shippingResponse.data?.data) throw new Error("Invalid response from RajaOngkir");

    const shippingOption = shippingResponse.data.data.find(option =>
      option.code === shippingCode && option.service === shippingService
    );

    if (!shippingOption) {
      logger.warn("🚫 Invalid shipping option selected");
      return res.status(400).json({ message: "Invalid shipping option selected" });
    }

    const shippingCost = shippingOption.cost;
    const shippingCourier = shippingOption.name;
    logger.info(`✅ Shipping selected: ${shippingCourier} - ${shippingService}, Cost: ${shippingCost}`);

    const itemDetails = user.carts.map(cart => ({
      id: cart.bookId,
      name: cart.book.title,
      price: cart.book.price,
      quantity: cart.quantity
    }));

    const totalItemPrice = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = totalItemPrice + shippingCost;

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

    logger.info(`📝 Order created: ID=${order.id}, Total=${totalAmount}`);

    const transactionParams = {
      transaction_details: {
        order_id: order.id,
        gross_amount: totalAmount
      },
      item_details: [
        ...itemDetails,
        {
          id: "SHIPPING",
          name: `Shipping (${shippingCourier})`,
          price: shippingCost,
          quantity: 1
        }
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
    logger.info(`💳 Midtrans transaction created: token=${transaction.token}`);

    await prisma.order.update({
      where: { id: order.id },
      data: { shippingTrackingId: transaction.token }
    });

    await prisma.cart.deleteMany({ where: { userId } });

    logger.info(`✅ Checkout completed for user ID: ${userId}`);
    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });

  } catch (error) {
    logger.error(`❌ Checkout Error: ${error.message}`);
    res.status(500).json({ message: "Checkout failed", error: error.message });
  }
});

router.get("/shipping-options", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: { where: { isDefault: true } } }
    });

    if (!user) {
      logger.warn("❗ User not found on shipping options check");
      return res.status(404).json({ message: "User not found" });
    }

    const defaultAddress = user.addresses.find(addr => addr.isDefault);
    if (!defaultAddress) {
      logger.warn("📭 No default address found during shipping option check");
      return res.status(400).json({ message: "No default address found" });
    }

    const shippingData = qs.stringify({
      origin: "31555",
      destination: defaultAddress.zip,
      weight: 100,
      courier: "jne:sicepat:jnt"
    });

    const shippingResponse = await axios.post(RAJAONGKIR_API_URL, shippingData, {
      headers: {
        "key": process.env.RAJAONGKIR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!shippingResponse.data?.data) throw new Error("Invalid response from RajaOngkir");

    logger.info(`📦 Shipping options fetched for user ID: ${userId}`);
    res.json({ shippingOptions: shippingResponse.data.data });

  } catch (error) {
    logger.error(`❌ Shipping Options Error: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch shipping options", error: error.message });
  }
});

export default router;

  import express from "express";
  import { PrismaClient } from "@prisma/client";

  const router = express.Router();
  const prisma = new PrismaClient();

  router.post("/", async (req, res) => {
    try {
      const { order_id, transaction_status } = req.body;

      let status = "pending";
      if (transaction_status === "capture" || transaction_status === "settlement") {
        status = "paid";
      } else if (transaction_status === "cancel" || transaction_status === "deny" || transaction_status === "expire") {
        status = "failed";
      }

      await prisma.order.update({
        where: { id: order_id },
        data: { status }
      });

      onsole.log(`Order ${order_id} status updated to ${status}`);

      res.json({ message: "Order status updated" });
    } catch (error) {
      console.error("Midtrans Webhook Error:", error);
      res.status(500).json({ message: "Webhook processing failed", error: error.message });
    }
  });

  export default router;

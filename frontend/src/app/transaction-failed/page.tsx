"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function TransactionFailed() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center">
      <XCircle className="w-24 h-24 text-red-500" />
      <h1 className="text-3xl font-bold mt-4">Transaksi Gagal</h1>
      <p className="text-gray-400 mt-2">Terjadi kesalahan saat memproses pembayaran Anda.</p>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Menggunakan router untuk navigasi
import toast from "react-hot-toast";

interface ShippingOption {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export default function CheckoutPage() {
  const router = useRouter(); // Inisialisasi router
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<{ code: string; service: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Untuk state loading saat checkout

  const fetchShippingOptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/checkout/shipping-options", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch shipping options");
      }
      const data = await response.json();
      setShippingOptions(data.shippingOptions);
    } catch (error) {
      toast.error("Gagal mengambil opsi pengiriman");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  const handleCheckout = async () => {
    if (!selectedOption) {
      toast.error("Silakan pilih opsi pengiriman terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          shippingCode: selectedOption.code,
          shippingService: selectedOption.service,
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout gagal, silakan coba lagi.");
      }

      const data = await response.json();
      toast.success("Checkout berhasil, mengarahkan ke pembayaran...");

      // Redirect ke redirect_url yang diberikan oleh backend
      router.push(data.redirect_url);
    } catch (err) {
      toast.error("Terjadi kesalahan saat checkout.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <h2 className="text-xl font-semibold mb-2">Pilih Opsi Pengiriman:</h2>
      {isLoading ? (
        <p>Loading shipping options...</p>
      ) : (
        <div className="space-y-4">
          {shippingOptions.map((option) => (
            <div key={`${option.code}-${option.service}`} className="bg-gray-800 p-4 rounded-lg flex justify-between">
              <label className="flex items-center space-x-3 w-full cursor-pointer">
                <input
                  type="radio"
                  name="shipping"
                  value={`${option.code}-${option.service}`}
                  checked={selectedOption?.code === option.code && selectedOption?.service === option.service}
                  onChange={() => setSelectedOption({ code: option.code, service: option.service })}
                  className="w-5 h-5 text-blue-500"
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold">{option.name} - {option.service}</p>
                  <p className="text-sm text-gray-400">{option.description}</p>
                  <p className="text-sm font-bold">Rp {option.cost.toLocaleString("id-ID")},00</p>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleCheckout}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
        disabled={!selectedOption || isSubmitting}
      >
        {isSubmitting ? "Memproses..." : "Lanjutkan Pembayaran"}
      </button>
    </div>
  );
}

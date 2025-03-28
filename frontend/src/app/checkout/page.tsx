"use client";

import { useEffect, useState } from "react";
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
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchShippingOptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/checkout/shipping-options", {
        method: "GET",
        credentials: "include",
      });
      console.log("Response:", response);
      if (!response.ok) {
        throw new Error("Failed to fetch shipping options");
      }
      const data = await response.json();
      console.log("Data:", data);
      console.log("Shipping options:", data.shippingOptions);
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

  return (
    <div className="max-w-2xl mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <h2 className="text-xl font-semibold mb-2">Pilih Opsi Pengiriman:</h2>
      {isLoading ? (
        <p>Loading shipping options...</p>
      ) : (
        <div className="space-y-4">
          {shippingOptions.map((option) => (
            <div key={option.code} className="bg-gray-800 p-4 rounded-lg flex justify-between">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="shipping"
                  value={option.code}
                  checked={selectedOption === option.code}
                  onChange={() => setSelectedOption(option.code)}
                  className="w-5 h-5 text-blue-500"
                />
                <div>
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
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={!selectedOption}
      >
        Lanjutkan Pembayaran
      </button>
    </div>
  );
}

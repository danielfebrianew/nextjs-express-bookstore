"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ShippingOptionsPage() {
  const [shippingOptions, setShippingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  const fetchShippingOptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/v1/checkout/shipping-options", {
        method: "GET",
        credentials: "include", // Automatically include cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "Failed to fetch shipping options");
      }

      const data = await response.json();
      if (!data.shippingOptions || data.shippingOptions.length === 0) {
        toast.error("No shipping options available.");
        return;
      }

      console.log("Shipping options:", data.shippingOptions);
      setShippingOptions(data.shippingOptions);
    } catch (error) {
      toast.error("Failed to fetch shipping options");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p>Loading shipping options...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Shipping Options</h1>
      {shippingOptions.length === 0 ? (
        <p>No shipping options available.</p>
      ) : (
        <ul className="space-y-4">
          {shippingOptions.map((option: any, index: number) => (
            <li key={index} className="p-4 border rounded-lg">
              <h2 className="text-lg font-bold">{option.name}</h2>
              <p>Service: {option.service}</p>
              <p>Description: {option.description}</p>
              <p>Cost: Rp {option.cost.toLocaleString()}</p>
              <p>Estimated Delivery Time: {option.etd || "N/A"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


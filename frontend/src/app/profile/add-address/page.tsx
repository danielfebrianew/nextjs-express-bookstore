"use client";

import React from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Define an interface for the shipping option type
interface ShippingOption {
  name: string;
  service: string;
  description: string;
  cost: number;
  etd?: string;
}

const fetchShippingOptions = async () => {
  // Extract token from cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    throw new Error('No authentication token found in cookies');
  }

  const response = await fetch("http://localhost:5000/api/v1/checkout/shipping-options", {
    method: "GET",
    credentials: "include", // Important for sending cookies
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch shipping options");
  }

  const data = await response.json();
  return data.shippingOptions;
};

export default function ShippingOptionsPage() {
  const { 
    data: shippingOptions = [], 
    isLoading, 
    isError
  } = useQuery<ShippingOption[], Error>({
    queryKey: ["shippingOptions"],
    queryFn: fetchShippingOptions,
    onError: (err: Error) => {
      toast.error(err.message || "Failed to fetch shipping options");
    },
  } as UseQueryOptions<ShippingOption[], Error>);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Shipping Options</h1>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2">Loading shipping options...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Shipping Options</h1>
        <p>Failed to load shipping options. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Shipping Options</h1>
      {shippingOptions.length === 0 ? (
        <p>No shipping options available.</p>
      ) : (
        <ul className="space-y-4">
          {shippingOptions.map((option, index) => (
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
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/api";
import { Pencil } from "lucide-react";

interface Address {
  id: string;
  userId: string;
  street: string;
  district: string;
  city: string;
  province: string;
  zip: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  idCardImage: string;
  addresses: Address[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileData = await authAPI.getProfile();
        console.log("Profile Data:", profileData);
        setUser(profileData);
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleAddAddress = () => {
    console.log("Navigating to add address page...");
    router.push("/profile/add-address");
  };

  const handleEdit = () => {
    console.log("Navigating to edit profile page...");
    router.push("/profile/edit");
  };

  if (loading) return <p className="text-gray-700">Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">User Profile</h1>
      <div className="bg-gray-900 shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <img
            src={user?.idCardImage}
            alt="ID Card"
            className="w-24 h-24 object-cover rounded-lg border"
          />
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-gray-300">{user?.email}</p>
            <p className="text-gray-300">{user?.phone}</p>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <button onClick={handleEdit} className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white">
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-6 text-white">Addresses</h3>
        <div className="mt-2">
          {user?.addresses.length ? (
            user?.addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border rounded-md mt-2 ${
                  address.isDefault ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                }`}
              >
                <p>
                  <strong>
                    {address.street}, {address.district}, {address.city}, {address.province},{" "}
                    {address.zip}
                  </strong>
                </p>
                {address.isDefault && (
                  <span className="text-sm text-yellow-300 font-semibold">
                    Default Address
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="mt-4 text-center">
              <p className="text-gray-400">No addresses found.</p>
              <button
                onClick={handleAddAddress}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Add New Address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

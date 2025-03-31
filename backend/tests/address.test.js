import request from "supertest";
import app from "../app.js"; // sesuaikan path kalau nama file server kamu beda

// Mock token, di dunia nyata bisa generate dari login atau pakai test user
const validToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0ZjYyMjUyLThlN2UtNDBlMi04NDViLTZmZTFhNzNmMTgzNSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQzMzA0NTQ2LCJleHAiOjE3NDMzOTA5NDZ9.V659RA6FrxQxL4qBGh32pLVscClXowFxmlig2PeKWcw";

describe("Address API", () => {
  test("GET /api/v1/addresses tanpa token harus gagal", async () => {
    const res = await request(app).get("/api/v1/addresses");
    expect(res.statusCode).toBe(401);
  });

  test("POST /api/v1/addresses tanpa token harus gagal", async () => {
    const res = await request(app)
      .post("/api/v1/addresses")
      .send({
        street: "Jl. Mawar",
        district: "Cicendo",
        city: "Bandung",
        province: "Jawa Barat",
        zip: "40123",
        isDefault: true
      });
    expect(res.statusCode).toBe(401);
  });

  test("POST /api/v1/addresses dengan data kosong harus gagal", async () => {
    const res = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", validToken)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

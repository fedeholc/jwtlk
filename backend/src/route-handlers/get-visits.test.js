import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import handleGetVisits from "./get-visits.js";
import { db } from "../global-store.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getVisits: vi.fn(),
    },
  };
});

const app = configServer();

app.post(apiEP.GET_VISITS, handleGetVisits);

describe("Get Visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should return 200 and visits if successfully retrieved", async () => {
    const mockVisits = [{ id: 1, visit: "visit1" }];
    // @ts-ignore
    db.getVisits.mockResolvedValue(mockVisits);

    const response = await request(app)
      .post(apiEP.GET_VISITS)
      .send({ payload: { user: { id: 1 } } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockVisits);
  });

  it("Should return 500 on internal server error", async () => {
    // @ts-ignore
    db.getVisits.mockRejectedValue(new Error("Internal server error"));

    const response = await request(app)
      .post(apiEP.GET_VISITS)
      .send({ payload: { user: { id: 1 } } });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});

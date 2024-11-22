import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import handleAddVisit from "./add-visit.js";
import { db } from "../global-store.js";

 

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      addVisit: vi.fn(),
    },
  };
});

const app = configServer();

app.post(apiEP.ADD_VISIT, handleAddVisit);

describe("Add Visit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should return 200 if visit is successfully added", async () => {
    // @ts-ignore
    db.addVisit.mockResolvedValue(true);

    const response = await request(app)
      .post(apiEP.ADD_VISIT)
      .send({ payload: { user: { id: 1 } } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it("Should return 500 if there is an error adding visit", async () => {
    // @ts-ignore
    db.addVisit.mockResolvedValue(false);

    const response = await request(app)
      .post(apiEP.ADD_VISIT)
      .send({ payload: { user: { id: 1 } } });

    expect(response.status).toBe(500);
    expect(response.body).toEqual("Error adding visit");
  });

  it("Should return 500 on internal server error", async () => {
    // @ts-ignore
    db.addVisit.mockRejectedValue(new Error("Internal server error"));

    const response = await request(app)
      .post(apiEP.ADD_VISIT)
      .send({ payload: { user: { id: 1 } } });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});

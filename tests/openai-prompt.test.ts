import { describe, it, expect } from "vitest";

// Mirror the confidence gate logic from src/lib/openai.ts
function applyConfidenceGate(
  direction: string,
  confidence: number,
  magnitude: string
): { direction: string; magnitude: string } {
  if (direction !== "flat" && confidence < 0.85) {
    return { direction: "flat", magnitude: "low" };
  }
  return { direction, magnitude };
}

// Mirror the flat constraint
function applyFlatConstraint(
  direction: string,
  magnitude: string
): { direction: string; magnitude: string } {
  if (direction === "flat" && magnitude !== "low") {
    return { direction: "flat", magnitude: "low" };
  }
  return { direction, magnitude };
}

describe("OpenAI Prediction Post-Processing", () => {
  describe("confidence gate (0.85 threshold)", () => {
    it("forces flat when directional confidence < 0.85", () => {
      expect(applyConfidenceGate("up", 0.84, "medium")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
      expect(applyConfidenceGate("down", 0.7, "high")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
      expect(applyConfidenceGate("up", 0.5, "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });

    it("allows directional at 0.85+", () => {
      expect(applyConfidenceGate("up", 0.85, "medium")).toEqual({
        direction: "up",
        magnitude: "medium",
      });
      expect(applyConfidenceGate("down", 0.95, "high")).toEqual({
        direction: "down",
        magnitude: "high",
      });
    });

    it("never modifies flat predictions", () => {
      expect(applyConfidenceGate("flat", 0.3, "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
      expect(applyConfidenceGate("flat", 0.9, "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });

    it("boundary: exactly 0.85 passes", () => {
      expect(applyConfidenceGate("up", 0.85, "medium").direction).toBe("up");
    });

    it("boundary: 0.849 fails", () => {
      expect(applyConfidenceGate("up", 0.849, "medium").direction).toBe("flat");
    });
  });

  describe("flat constraint", () => {
    it("forces magnitude to low when direction is flat", () => {
      expect(applyFlatConstraint("flat", "medium")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
      expect(applyFlatConstraint("flat", "high")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });

    it("does not modify non-flat predictions", () => {
      expect(applyFlatConstraint("up", "high")).toEqual({
        direction: "up",
        magnitude: "high",
      });
      expect(applyFlatConstraint("down", "medium")).toEqual({
        direction: "down",
        magnitude: "medium",
      });
    });

    it("flat + low is unchanged", () => {
      expect(applyFlatConstraint("flat", "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });
  });

  describe("combined pipeline", () => {
    function processPrediction(direction: string, confidence: number, magnitude: string) {
      let result = applyConfidenceGate(direction, confidence, magnitude);
      result = applyFlatConstraint(result.direction, result.magnitude);
      return result;
    }

    it("high confidence up stays up", () => {
      expect(processPrediction("up", 0.92, "medium")).toEqual({
        direction: "up",
        magnitude: "medium",
      });
    });

    it("low confidence up becomes flat/low", () => {
      expect(processPrediction("up", 0.6, "high")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });

    it("flat always stays flat/low regardless of confidence", () => {
      expect(processPrediction("flat", 0.3, "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
      expect(processPrediction("flat", 0.99, "low")).toEqual({
        direction: "flat",
        magnitude: "low",
      });
    });

    it("down at exactly 0.85 stays down", () => {
      expect(processPrediction("down", 0.85, "high")).toEqual({
        direction: "down",
        magnitude: "high",
      });
    });
  });
});

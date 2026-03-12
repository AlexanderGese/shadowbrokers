import { describe, it, expect } from "vitest";

// Extract the accuracy scoring logic so we can test it in isolation
// This mirrors the logic from src/lib/accuracy.ts

function determineActualDirection(changePct: number): string {
  if (changePct > 1.5) return "up";
  if (changePct < -1.5) return "down";
  return "flat";
}

function isDirectionCorrect(
  predictedDirection: string,
  actualDirection: string,
  changePct: number,
  predictedMagnitude: string
): boolean {
  let correct = false;

  if (predictedDirection === actualDirection) {
    correct = true;
  } else if (predictedDirection === "flat") {
    correct = Math.abs(changePct) <= 2.5;
  } else if (actualDirection === "flat") {
    if (predictedDirection === "up" && changePct > 0) correct = true;
    if (predictedDirection === "down" && changePct < 0) correct = true;
  }

  if (!correct && predictedMagnitude === "low") {
    if (Math.abs(changePct) <= 2.0) correct = true;
  }

  return correct;
}

function calculateChangePct(basePrice: number, currentPrice: number): number {
  return ((currentPrice - basePrice) / basePrice) * 100;
}

describe("Accuracy Scoring", () => {
  describe("determineActualDirection", () => {
    it("returns 'up' for changes above 1.5%", () => {
      expect(determineActualDirection(1.6)).toBe("up");
      expect(determineActualDirection(5.0)).toBe("up");
      expect(determineActualDirection(10.0)).toBe("up");
    });

    it("returns 'down' for changes below -1.5%", () => {
      expect(determineActualDirection(-1.6)).toBe("down");
      expect(determineActualDirection(-5.0)).toBe("down");
      expect(determineActualDirection(-10.0)).toBe("down");
    });

    it("returns 'flat' for changes within ±1.5%", () => {
      expect(determineActualDirection(0)).toBe("flat");
      expect(determineActualDirection(0.5)).toBe("flat");
      expect(determineActualDirection(-0.5)).toBe("flat");
      expect(determineActualDirection(1.5)).toBe("flat");
      expect(determineActualDirection(-1.5)).toBe("flat");
      expect(determineActualDirection(1.49)).toBe("flat");
    });

    it("boundary: exactly 1.5% is flat, above is up", () => {
      expect(determineActualDirection(1.5)).toBe("flat");
      expect(determineActualDirection(1.51)).toBe("up");
    });
  });

  describe("isDirectionCorrect", () => {
    it("exact match is always correct", () => {
      expect(isDirectionCorrect("flat", "flat", 0.5, "low")).toBe(true);
      expect(isDirectionCorrect("up", "up", 3.0, "medium")).toBe(true);
      expect(isDirectionCorrect("down", "down", -3.0, "high")).toBe(true);
    });

    it("predicted flat, actual moved within ±2.5% is correct", () => {
      expect(isDirectionCorrect("flat", "up", 2.0, "low")).toBe(true);
      expect(isDirectionCorrect("flat", "down", -2.0, "low")).toBe(true);
      expect(isDirectionCorrect("flat", "up", 2.5, "low")).toBe(true);
    });

    it("predicted flat, actual moved >2.5% is wrong", () => {
      expect(isDirectionCorrect("flat", "up", 3.0, "low")).toBe(false);
      expect(isDirectionCorrect("flat", "down", -4.0, "low")).toBe(false);
    });

    it("predicted directional, actual flat but same sign is correct", () => {
      expect(isDirectionCorrect("up", "flat", 0.5, "medium")).toBe(true);
      expect(isDirectionCorrect("down", "flat", -0.5, "medium")).toBe(true);
    });

    it("predicted directional, actual flat but opposite sign is wrong", () => {
      expect(isDirectionCorrect("up", "flat", -0.5, "medium")).toBe(false);
      expect(isDirectionCorrect("down", "flat", 0.5, "medium")).toBe(false);
    });

    it("predicted up but went down is always wrong", () => {
      expect(isDirectionCorrect("up", "down", -3.0, "medium")).toBe(false);
      expect(isDirectionCorrect("up", "down", -5.0, "high")).toBe(false);
    });

    it("predicted down but went up is always wrong", () => {
      expect(isDirectionCorrect("down", "up", 3.0, "medium")).toBe(false);
      expect(isDirectionCorrect("down", "up", 5.0, "high")).toBe(false);
    });

    it("low magnitude leniency: wrong direction within ±2% is correct", () => {
      expect(isDirectionCorrect("up", "down", -1.8, "low")).toBe(true);
      expect(isDirectionCorrect("down", "up", 1.8, "low")).toBe(true);
    });

    it("low magnitude leniency does not apply beyond ±2%", () => {
      expect(isDirectionCorrect("up", "down", -2.5, "low")).toBe(false);
      expect(isDirectionCorrect("down", "up", 3.0, "low")).toBe(false);
    });

    it("medium/high magnitude: no leniency for wrong direction", () => {
      expect(isDirectionCorrect("up", "down", -1.8, "medium")).toBe(false);
      expect(isDirectionCorrect("down", "up", 1.8, "high")).toBe(false);
    });
  });

  describe("calculateChangePct", () => {
    it("calculates correct percentage change", () => {
      expect(calculateChangePct(100, 105)).toBeCloseTo(5.0);
      expect(calculateChangePct(100, 95)).toBeCloseTo(-5.0);
      expect(calculateChangePct(200, 200)).toBeCloseTo(0);
      expect(calculateChangePct(50, 51)).toBeCloseTo(2.0);
    });

    it("handles small price movements", () => {
      expect(calculateChangePct(150, 150.75)).toBeCloseTo(0.5);
      expect(calculateChangePct(150, 149.25)).toBeCloseTo(-0.5);
    });
  });

  describe("end-to-end scoring scenarios", () => {
    function score(predicted: string, magnitude: string, basePrice: number, currentPrice: number) {
      const changePct = calculateChangePct(basePrice, currentPrice);
      const actual = determineActualDirection(changePct);
      return isDirectionCorrect(predicted, actual, changePct, magnitude);
    }

    it("flat prediction on a stable stock is correct", () => {
      expect(score("flat", "low", 100, 100.5)).toBe(true);
      expect(score("flat", "low", 100, 99.5)).toBe(true);
    });

    it("flat prediction on a volatile stock is wrong if >2.5%", () => {
      expect(score("flat", "low", 100, 103)).toBe(false);
      expect(score("flat", "low", 100, 97)).toBe(false);
    });

    it("correct bullish call", () => {
      expect(score("up", "medium", 100, 103)).toBe(true);
    });

    it("correct bearish call", () => {
      expect(score("down", "medium", 100, 97)).toBe(true);
    });

    it("wrong directional call", () => {
      expect(score("up", "medium", 100, 95)).toBe(false);
      expect(score("down", "medium", 100, 105)).toBe(false);
    });

    it("bullish call on slight uptick (flat zone) counts as correct", () => {
      // Stock went up 0.8% - actual is "flat" but sign matches "up"
      expect(score("up", "medium", 100, 100.8)).toBe(true);
    });

    it("bearish call on slight downtick (flat zone) counts as correct", () => {
      expect(score("down", "medium", 100, 99.2)).toBe(true);
    });
  });
});

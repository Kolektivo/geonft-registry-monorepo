import { ethers } from "hardhat";
import chai from "chai";
import { Trigonometry } from "../typechain";

const { expect } = chai;

let trigonometry: Trigonometry;

describe("registry", () => {
  beforeEach(async () => {
    const trigonometryFactory = await ethers.getContractFactory("Trigonometry");

    trigonometry = (await trigonometryFactory.deploy()) as Trigonometry;
  });

  // Due to Solidity limitations, the Trigonometry.sin() function requires more steps to calculate
  // a sine value approximation.
  describe("sin function", async () => {
    it("calculate the sine of an angle with a certain error margin", async () => {
      const calculateJavascriptSine = (angleInDegrees: number): number => {
        const angleInRadians = angleInDegrees * (Math.PI / 180);
        const sine = Math.sin(angleInRadians);
        return sine;
      };

      const calculateSoliditySine = async (
        angleInDegrees: number
      ): Promise<number> => {
        // Refer to Trigonometry.sol and AreaCalculation.sol to know more about these constants
        const ANGLE_UNITS = 1073741824;
        const MAX_ANGLE = 2147483647;
        const tAngle = (angleInDegrees * ANGLE_UNITS) / 360;
        const relativeSine = await trigonometry.sin(tAngle);
        const sine = relativeSine.toNumber() / MAX_ANGLE;
        return sine;
      };

      function roundSine(sine: number): number {
        // Decimals tolerance to round sine value
        const DECIMALS = 6;
        const EXPONENT = 10 ** DECIMALS;
        const value = Math.round((sine + Number.EPSILON) * EXPONENT) / EXPONENT;
        return value;
      }

      const angles = [10, 30, 45, 90, 200, 300];

      angles.map(async (angle) => {
        const soliditySine = await calculateSoliditySine(angle);
        const javascriptSine = calculateJavascriptSine(angle);

        expect(roundSine(soliditySine)).to.equal(roundSine(javascriptSine));
      });
    });
  });
});

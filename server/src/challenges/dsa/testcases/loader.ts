import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DsaTestCase } from "@debugLabs/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTestcasesDir(): string {
  if (fs.existsSync(path.join(__dirname, "two-sum"))) {
    return __dirname;
  }
  const srcDir = path.resolve(__dirname, "../../../../src/challenges/dsa/testcases");
  if (fs.existsSync(srcDir)) {
    return srcDir;
  }
  return __dirname;
}

function parseCases(inputRaw: string, outputRaw: string, hidden: boolean): DsaTestCase[] {
  const inputs = inputRaw.split(/^\s*===\s*$/m).map((s) => s.trim()).filter((s) => s.length > 0);
  const outputs = outputRaw.split(/^\s*===\s*$/m).map((s) => s.trim());

  const prefix = hidden ? "htc" : "tc";
  const namePrefix = hidden ? "Hidden Case" : "Case";

  return inputs.map((input, idx) => ({
    id: `${prefix}-${idx + 1}`,
    name: `${namePrefix} ${idx + 1}`,
    input,
    expectedOutput: outputs[idx] !== undefined ? outputs[idx] : "",
    hidden,
  }));
}

export function loadProblemTestCases(problemId: string): {
  testCases: DsaTestCase[];
  hiddenTestCases: DsaTestCase[];
} {
  const baseDir = getTestcasesDir();
  const dir = path.join(baseDir, problemId);
  if (!fs.existsSync(dir)) {
    return { testCases: [], hiddenTestCases: [] };
  }

  const sampleInPath = path.join(dir, "sample_input.txt");
  const sampleOutPath = path.join(dir, "sample_output.txt");
  const hiddenInPath = path.join(dir, "hidden_input.txt");
  const hiddenOutPath = path.join(dir, "hidden_output.txt");

  const testCases =
    fs.existsSync(sampleInPath) && fs.existsSync(sampleOutPath)
      ? parseCases(fs.readFileSync(sampleInPath, "utf8"), fs.readFileSync(sampleOutPath, "utf8"), false)
      : [];

  const hiddenTestCases =
    fs.existsSync(hiddenInPath) && fs.existsSync(hiddenOutPath)
      ? parseCases(fs.readFileSync(hiddenInPath, "utf8"), fs.readFileSync(hiddenOutPath, "utf8"), true)
      : [];

  return { testCases, hiddenTestCases };
}

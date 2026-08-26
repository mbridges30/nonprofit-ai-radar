import { curateRadar } from "./curate";

const dryRun = process.argv.includes("--dry-run");
const perArg = process.argv.find((a) => a.startsWith("--per-category="));
const perCategory = perArg ? parseInt(perArg.split("=")[1], 10) : undefined;

curateRadar({ dryRun, perCategory })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

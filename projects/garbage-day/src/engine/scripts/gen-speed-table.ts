// Regenerates src/speed-table.ts. Run from src/engine: node scripts/gen-speed-table.ts
import { writeFileSync } from 'node:fs';
import { generateSpeedTable, renderSpeedTable } from '../src/speed-table-gen.ts';

const out = new URL('../src/speed-table.ts', import.meta.url);
writeFileSync(out, renderSpeedTable(generateSpeedTable()));
console.log(`Wrote ${out.pathname}`);

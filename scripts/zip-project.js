import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectDir = 'c:\\Users\\ayush\\Downloads\\vurlo-codebase';
const excludes = /^(node_modules|\.git|\.vercel|\.wrangler|dist|\.env|\.env\.local|.*\.zip)$/i;

const items = fs.readdirSync(projectDir)
  .filter(item => !excludes.test(item));

console.log("Packing items:", items);

// Run tar using child_process
const cmd = `tar -a -c -f VURLO16.ZIP ${items.map(item => `"${item}"`).join(' ')}`;
console.log("Executing command:", cmd);

try {
  execSync(cmd, { cwd: projectDir, stdio: 'inherit' });
  console.log("Successfully updated VURLO16.ZIP");
} catch (error) {
  console.error("Failed to build zip:", error);
}

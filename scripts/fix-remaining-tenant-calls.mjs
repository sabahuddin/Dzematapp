#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const inputFile = 'server/routes.ts';
let content = readFileSync(inputFile, 'utf-8');

// Fix recalculateUserPoints calls
content = content.replace(
  /await storage\.recalculateUserPoints\(([^,)]+)\)(?!,)/g,
  'await storage.recalculateUserPoints($1, tenantId)'
);

// Fix checkAndAwardBadges calls
content = content.replace(
  /await storage\.checkAndAwardBadges\(([^,)]+)\)(?!,)/g,
  'await storage.checkAndAwardBadges($1, tenantId)'
);

// Fix removeUnqualifiedBadges calls
content = content.replace(
  /await storage\.removeUnqualifiedBadges\(([^,)]+)\)(?!,)/g,
  'await storage.removeUnqualifiedBadges($1, tenantId)'
);

// Fix getAllUserBadges calls
content = content.replace(
  /await storage\.getAllUserBadges\(\)(?![\s,])/g,
  'await storage.getAllUserBadges(tenantId)'
);

// Fix getUserTasksCompleted calls
content = content.replace(
  /storage\.getUserTasksCompleted\(([^,)]+)\)(?!,)/g,
  'storage.getUserTasksCompleted($1, tenantId)'
);

// Fix getUserEventsAttended calls
content = content.replace(
  /storage\.getUserEventsAttended\(([^,)]+)\)(?!,)/g,
  'storage.getUserEventsAttended($1, tenantId)'
);

// Fix deleteActivityLogByRelatedEntity calls
content = content.replace(
  /await storage\.deleteActivityLogByRelatedEntity\(([^,)]+)\)(?!,)/g,
  'await storage.deleteActivityLogByRelatedEntity($1, tenantId)'
);

// Fix the duplicate route definition issue at line 3331
// Remove duplicate "app.get("/api/user-stats/:userId"" line
const lines = content.split('\n');
const fixedLines = [];
let prevLine = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip duplicate route definition
  if (line.includes('app.get("/api/user-stats/:userId"') && prevLine.includes('app.get("/api/user-stats/:userId"')) {
    continue;
  }
  fixedLines.push(line);
  prevLine = line;
}

content = fixedLines.join('\n');

// Also need to add tenantId to the user-stats route since it's missing
content = content.replace(
  /app\.get\("\/api\/user-stats\/:userId", requireAuth, async \(req, res\) => \{\s*try \{\s*\/\/ Only admins/,
  `app.get("/api/user-stats/:userId", requireAuth, async (req, res) => {
    try {
      const tenantId = req.tenantId!;
      // Only admins`
);

writeFileSync(inputFile, content, 'utf-8');

console.log('✓ Fixed remaining tenant ID calls');
console.log('- recalculateUserPoints');
console.log('- checkAndAwardBadges');
console.log('- removeUnqualifiedBadges');
console.log('- getAllUserBadges');
console.log('- getUserTasksCompleted');
console.log('- getUserEventsAttended');
console.log('- deleteActivityLogByRelatedEntity');
console.log('- Fixed duplicate route definition');

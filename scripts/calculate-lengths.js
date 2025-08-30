const fs = require('fs');
const path = require('path');

const levelsFilePath = path.join(
  __dirname,
  '../src/assets/word-search-levels.json',
);
const levels = JSON.parse(fs.readFileSync(levelsFilePath, 'utf-8'));

console.log('Spúšťam výpočet dĺžky tajničiek...');
console.log('================================');

levels.forEach(level => {
  const { id, name, gridSize, words } = level;
  const totalWordsLength = words.reduce((sum, word) => sum + word.length, 0);
  const gridArea = gridSize * gridSize;
  const requiredTajnickaLength = gridArea - totalWordsLength;

  console.log(`--- Level ${id}: ${name} ---`);
  console.log(`  Mriežka: ${gridSize}x${gridSize} = ${gridArea}`);
  console.log(`  Dĺžka slov: ${totalWordsLength}`);
  console.log(`  POŽADOVANÁ DĹŽKA TAJNIČKY: ${requiredTajnickaLength}`);
  console.log('--------------------------------');
});

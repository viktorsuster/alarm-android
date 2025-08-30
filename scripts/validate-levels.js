const fs = require('fs');
const path = require('path');

const levelsFilePath = path.join(
  __dirname,
  '../src/assets/word-search-levels.json',
);
const levels = JSON.parse(fs.readFileSync(levelsFilePath, 'utf-8'));

let allLevelsValid = true;

console.log('Spúšťam validáciu levelov...');
console.log('================================');

levels.forEach((level, index) => {
  console.log(`Validujem Level ${level.id} - ${level.name}...`);

  let levelIsValid = true;
  const { gridSize, words, tajnicka } = level;

  // 1. Kontrola, či žiadne slovo nie je dlhšie ako mriežka
  const longWords = words.filter(word => word.length > gridSize);
  if (longWords.length > 0) {
    console.error(
      `  ERROR: Nasledujúce slová sú dlhšie ako mriežka (${gridSize}): ${longWords.join(
        ', ',
      )}`,
    );
    levelIsValid = false;
    allLevelsValid = false;
  }

  // 2. Kontrola, či dĺžka tajničky zodpovedá voľnému miestu
  const totalWordsLength = words.reduce((sum, word) => sum + word.length, 0);
  const gridArea = gridSize * gridSize;
  const remainingSpace = gridArea - totalWordsLength;
  const tajnickaLength = tajnicka.replace(/\s/g, '').length;

  if (remainingSpace !== tajnickaLength) {
    console.error(`  ERROR: Nesedí dĺžka tajničky!`);
    console.error(
      `    - Veľkosť mriežky: ${gridSize}x${gridSize} = ${gridArea} políčok`,
    );
    console.error(`    - Dĺžka všetkých slov: ${totalWordsLength}`);
    console.error(`    - Zostávajúce miesto: ${remainingSpace}`);
    console.error(`    - Požadovaná dĺžka tajničky: ${tajnickaLength}`);
    levelIsValid = false;
    allLevelsValid = false;
  }

  if (levelIsValid) {
    console.log('  OK: Level je platný.');
  }
  console.log('--------------------------------');
});

console.log('================================');
if (allLevelsValid) {
  console.log('Všetky levely úspešne prešli validáciou!');
} else {
  console.error(
    'Validácia zlyhala. Prosím, opravte chyby vo vyššie uvedených leveloch.',
  );
  process.exit(1); // Ukončí skript s chybovým kódom
}

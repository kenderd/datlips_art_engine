const readline = require('readline');
const basePath = process.cwd();
const { startCreating, buildSetup, rarityBreakdown, createPNG } = require(`${basePath}/src/main.js`);

const runScript = async () => {

  buildSetup();
  await startCreating();
  await rarityBreakdown();

  const answer = await askUserConfirmation();

  // Remember to write something to clear imgData from metadata before finalizing everything. 

  if (answer === 'Y') {
    await createPNG();
  } else {
    console.log('Process aborted.');
    process.exit(0);
  }
};

const askUserConfirmation = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('Please review rarity breakdown above and metadata in build folder. Proceed with image generation? (Y/N): ', answer => {
      rl.close();
      resolve(answer.toUpperCase());
    });
  });
};

runScript().catch(err => {
  console.error('An error occurred:', err);
});

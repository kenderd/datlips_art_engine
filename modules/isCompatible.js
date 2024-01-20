const readline = require('readline');
const fs = require("fs");
const path = require("path");
const basePath = process.cwd();
const { format, layerConfigurations } = require(`${basePath}/src/config.js`);
const { Select } = require('enquirer');
const { createCanvas, loadImage } = require("canvas");

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

// Create compatibility directory if it doesn't already exist
const dir = `${basePath}/compatibility`;
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, {
		recursive: true
	});
}

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split('#').shift();
  return nameWithoutWeight;
};

const askUserConfirmation = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${question} (Y/N): `, answer => {
      rl.close();
      resolve(answer.toUpperCase());
    });
  });
};

const layers = [];
let compatibility = {};
let nest = {}

const listCompatibility = async () => {
  layerConfigurations.forEach((layerConfig, configIndex) => {
    const layersOrder = layerConfig.layersOrder;
    const tempLayers = [];

    layersOrder.forEach((layer, layerIndex) => {
      tempLayers.push(layer.name);
      const filePath = `${basePath}/layers/${layer.name}`
      const files = fs.readdirSync(filePath);

      const imageFiles = files.filter(file => {
        const isFile = fs.statSync(path.join(filePath, file)).isFile();
        const isImage = /\.(png|gif)$/i.test(file);
        if (isFile && !isImage) {
          console.log(`Non-image file detected: ${filePath}/${file}.
          Please be sure to review and remove non-image files before generation!`);
        }
        return isFile && isImage;
      });

      imageFiles.forEach((file) => {
        const trait = cleanName(file);
        if (!compatibility[layer.name]) {
          compatibility[layer.name] = {};
        }
        compatibility[layer.name][trait] = {};

        for (let nextLayerIndex = layerIndex + 1; nextLayerIndex < layersOrder.length; nextLayerIndex++) {
          const nextLayer = layersOrder[nextLayerIndex].name;
          compatibility[layer.name][trait][nextLayer] = fs.readdirSync(`${basePath}/layers/${nextLayer}`)
            .map(cleanName);
        }
      });
    });
    layers.push(tempLayers);
  });
}

const nestedStructure = async () => {
  const topLayers = [];

  layers.forEach((layersOrder, index) => {
    let tempTopLayers = [];
    layersOrder.forEach((layer) => {
      const traits = Object.keys(compatibility[layer]);
      tempTopLayers.push(traits);
    });
    topLayers[index] = tempTopLayers;
  });

  topLayers.forEach((layersOrder, index) => {
    const lastLayerIndex = layersOrder.length - 1
    
    let previousLayer = {};

    for ( let i = lastLayerIndex; i >= 0; i--) {
      if (i == lastLayerIndex) { // Last layer
        let endOfNest = {};
        layersOrder[i].forEach((layer) => {
          endOfNest[layer] = {};
        })
        previousLayer = endOfNest;
      } else { // Everything else
        let lStruct = {}
        layersOrder[i].forEach((layer) => {
          lStruct[layer] = previousLayer;
        })
        previousLayer = lStruct;
      }
      nest[index] = previousLayer;
    }
  });
}

var parents = [];
const incompatibleTraits = [];

const getAllPaths = (currentObj, path, initTrait, targetTrait, initLayerIndex) => {

  const keys = Object.keys(currentObj);

  for (const key of keys) {
    if (keys.includes(initTrait)) {
      if (key != initTrait) {
        if (!parents.includes(key)) {
          parents.push(key);
        }
      }
    }

    const newPath = initLayerIndex == 0 ? path : path.concat([key]);

    if (key === targetTrait) {
      incompatibleTraits.push(newPath);
    } else if (typeof currentObj[key] === 'object') {
      getAllPaths(currentObj[key], newPath, initTrait, targetTrait, initLayerIndex + 1);
    }
  }
};

const incompatibilities = {};

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const checkCompatibility = async () => {
  parents = [];
  
  const selectLayersOrder = new Select({
    name: 'layersOrder',
    message: 'Which layersOrder index contains the incompatibility (starting at 0)?',
    choices: Object.keys(nest),
  })

  const layersOrder = Object.keys(nest).length > 1 ? await selectLayersOrder.run() : 0;

  const selectFirstLayer = new Select({
    name: 'layer',
    message: 'What layer is your first trait in?',
    choices: layers[layersOrder].slice(0, -1).map(layer => layer),
  });

  const firstLayer = await selectFirstLayer.run();
  const indexOfFirstLayer = layers[layersOrder].findIndex(layer => layer === firstLayer);

  const selectFirstTrait = new Select({
    name: 'trait',
    message: 'Select first trait:',
    choices: Object.keys(compatibility[firstLayer]),
  });

  const firstTrait = await selectFirstTrait.run();

  const choicesForSecondLayer = layers[layersOrder].slice(indexOfFirstLayer + 1).map(layer => layer);

  const selectSecondLayer = new Select({
    name: 'layer',
    message: 'Select the second layer:',
    choices: choicesForSecondLayer,
  });

  const secondLayer = await selectSecondLayer.run();
  const indexOfSecondLayer = layers[layersOrder].findIndex(layer => layer === secondLayer);

  const selectSecondTrait = new Select({
    name: 'trait',
    message: 'Select incompatible trait',
    choices: Object.keys(compatibility[secondLayer]),
  });

  const secondTrait = await selectSecondTrait.run();

  // Get all paths for incompatible traits
  if (indexOfFirstLayer === 0) {
    const firstLayerObj = nest[layersOrder];
    getAllPaths(firstLayerObj, [firstTrait], firstTrait, secondTrait, indexOfFirstLayer);
  } else {
    const root = Object.keys(nest[layersOrder]);
    for (let i = 0; i < root.length; i++) {
      const currentLayerObj = nest[layersOrder][root[i]];
      getAllPaths(currentLayerObj, [root[i]], firstTrait, secondTrait, indexOfFirstLayer);
    }
  }  

  // Then filter them down to only full paths where both traits are present
  const filteredIncompatibleTraits = incompatibleTraits.filter(path =>
    path.includes(firstTrait)
  );

  let incompatibilty = {
    parents,
    parentIndex: indexOfFirstLayer,
    childIndex: indexOfSecondLayer,
    layerIndex: Number(layersOrder),
    maxCount: 0
  }

  // Log each incompatibility as it's own object for use in generation later
  if (!incompatibilities[secondTrait]) {
    incompatibilities[secondTrait] = incompatibilty;
  } else {
    const remainingParents = incompatibilities[secondTrait].parents.filter(
      element => incompatibilty.parents.includes(element)
    );
    if (remainingParents.length == 0) {
      throw new Error(`No parent layers remaining for ${secondTrait}, which would result in 0 generation of that trait.` +
      ` Please review your layer folders and your previous selections, then try again. `)
    }
    incompatibilities[secondTrait].parents = remainingParents
  }

  // Delete each item at specified paths
  for (let i = 0; i < filteredIncompatibleTraits.length; i++) {
    const pathToDelete = filteredIncompatibleTraits[i];
    let nestedObjectCopy = deepCopy(nest);
    let currentObj = nestedObjectCopy[layersOrder];
  
    for (const segment of pathToDelete) {
      if (currentObj && currentObj.hasOwnProperty(segment) && Object.keys(currentObj[segment]).length !== 0) {
        if(secondTrait != segment) {
          currentObj = currentObj[segment];
        }
      }
    }

    delete currentObj[secondTrait];

    nest = nestedObjectCopy
  }

  console.log(`${firstTrait} marked incompatible with ${secondTrait}`);

  // Above works perfectly for defining individual incompatibilities when you know them. 
  // Next, build out system(s) for bulk entry. This can be fairly simple:
  // -define firstTrait[] and secondTrait[] as arrays (must match in length)
  // -this will require you to split the checkCompatibility function to separate the user prompts
  // from the trait removal. That way, you can simply iterate over the arrays and perform the same actions

  // as well, one that shows each trait combination to verify individually (for when user doesn't know)
}

function calculateMax(structure) {
  let count = 0;

  function traverse(obj, path) {
    for (const key in obj) {
      const currentPath = path.concat(key);
      
      if (typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
        count++;
      }
      
      if (typeof obj[key] === 'object') {
        traverse(obj[key], currentPath);
      }
    }
  }

  traverse(structure, []);
  return count;
}

const runScript = async () => {
  await listCompatibility();
  await nestedStructure();

  let answer = 'Y'

  while (answer == 'Y') {
    answer = await askUserConfirmation("Do you want to define an incompatibility?");

    if (answer === 'Y') {
      await checkCompatibility()
    } else if (answer !== 'N') {
      console.log("Please enter 'Y' or 'N'.");
    }
  }

  // updateIncompatibilityCounts();
  console.log(`Defined incompatibilities:`);
  console.log(incompatibilities);

  console.log(`With the defined incompatibilites and available traits, `+
    `a maximum of ${calculateMax(nest)} images can be generated`);

  // Save compatibility objects as JSON
  const jsonOutput = JSON.stringify(incompatibilities, null, 2);
  const outputFile = path.join(basePath, 'compatibility/compatibility.json');
  fs.writeFileSync(outputFile, jsonOutput);

  const njsonOutput = JSON.stringify(nest, null, 2);
  const noutputFile = path.join(basePath, 'compatibility/nest.json');
  fs.writeFileSync(noutputFile, njsonOutput);

  console.log(`Compatibility files created in ${basePath}/compatibility/`);
}

runScript().catch(err => {
  console.error('An error occurred:', err);
});
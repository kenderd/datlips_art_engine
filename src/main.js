const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  SEIMetadata,
  gif,
  resumeNum,
  rarity_config,
  collectionSize,
  exactWeight,
  layerVariations,
  importOldDna,
  allowDuplicates,
  enableStats,
  statBlocks,
  extraAttributes,
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var statList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);
const oldDna = `${basePath}/build_old/_oldDna.json`;
const nest = `${basePath}/compatibility/nest.json`;
const incompatible = `${basePath}/compatibility/compatibility.json`
let compatibility;
let incompatibilities;

let hashlipsGiffer = null;
let allTraitsCount;

const buildSetup = () => {
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
    fs.mkdirSync(`${buildDir}/json`);
    fs.mkdirSync(`${buildDir}/images`);
  } else {
    fs.rmSync(buildDir, { recursive: true } );
    fs.mkdirSync(buildDir);
    fs.mkdirSync(`${buildDir}/json`);
    fs.mkdirSync(`${buildDir}/images`);
  }
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }
  if (importOldDna) {
    let rawdata = fs.readFileSync(oldDna);
    let data = JSON.parse(rawdata);
    if (data.length !== resumeNum) {
      throw new Error(
        `resumeNum (${resumeNum}) does not match count in _oldDna file (${oldDna.length}). 
        Please make sure you have the correct _metadata file in the build_old folder and re-run generateOldDna`);
    }
    data.forEach((item) => {
      dnaList.add(item);
    });
  }
  let rawNestData = fs.readFileSync(nest);
  compatibility = JSON.parse(rawNestData);
  let rawCompatibleData = fs.readFileSync(incompatible);
  incompatibilities = JSON.parse(rawCompatibleData);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function cleanDna(_str) {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
}

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getRarityWeight = (_str) => {
  let weight = capitalizeFirstLetter(_str.slice(0, -4).split(rarityDelimiter).pop());
  if (exactWeight) {
    var finalWeight = weight;
  } else if (isNaN(weight)) {
    // Ensure non-number weights appropriately adhere to rarity_config
    if (!rarity_config[weight]) {
      throw new Error(`'${weight}' contained in ${_str} is not a valid rarity.` +
      ` Please ensure your weights adhere to rarity_config.`);
    }
    let rarity = Object.keys(rarity_config);
      for (let i = 0; i < rarity.length; i++) {
        if (rarity[i] == weight && i == 0) {
          var finalWeight = rarity_config[weight];
        } else if (rarity[i] == weight) {
          let min = rarity_config[rarity[i - 1]];
          let max = rarity_config[rarity[i]];
          var finalWeight = Math.floor(Math.random() * (max - min) + min);
        }
      }
    
  } else {
    var finalWeight = weight;
  }
  return Number(finalWeight);
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => {
      const fullPath = path + item;
      return fs.statSync(fullPath).isFile() && !/(^|\/)\.[^\/\.]/g.test(item);
    })
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
    layerVariations: 
      layerObj.options?.['layerVariations'] !== undefined
        ? layerObj.options?.['layerVariations']
        : undefined,
    ogName: layerObj.name,
    
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png", {
      resolution: format.dpi,
    }),
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${namePrefix} #${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "datboi1337 Art Engine (Hashlips fork)",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `${_edition}.png`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: `${_edition}.png`,
            type: "image/png",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.selectedElement;
  attributesList.push({
    trait_type: _element.name,
    value: selectedElement.name,
    imgData: {
      path: selectedElement.path,
      blend: _element.blend,
      opacity: _element.opacity,
    }
  });
};

const addStats = () => {
    statBlocks.forEach((stat) => {
    let min = stat.minValue;
    let max = stat.maxValue;
    let updatedValue = Math.floor(Math.random() * (max - min + 1)) + min;
    let newTrait = stat.attribute
    newTrait.value = updatedValue;
    statList.push(newTrait);
  });
}

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

// For reference
const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {

    if (_dna.split(DNA_DELIMITER)[index] == undefined) {
      throw new Error(`Something went wrong. There may be an issue in your ${layer.name} folder,`+
      ` but this issue hasn't been fully debugged yet. Please try again, and if you continue getting` +
      ` this error, review weights & file types. NOTE: All traits MUST contain a weight!`);
    }
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );

    if (_dna.search(selectedElement.name) < 0) {
      throw new Error(`There is an issue in your ${layer.name} folder. Please review weights & file types,`+
      ` then try again. NOTE: All traits MUST contain a weight!`);
    }

    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
      layerVariations: layer.layerVariations,
      variant: layer.layerVariations != undefined ? (_dna.split('&').pop()).split(DNA_DELIMITER).shift() : '',
      ogName: layer.ogName,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDnaExact = (_layers, _remainingInLayersOrder, _currentEdition, _variant, layerConfigIndex) => {
  let randNum = [];
  let nestLookup = []

  const incompatibleTraits = Object.keys(incompatibilities);

  // console.log(incompatibilities);

  let restrictedGeneration = false;

  if (incompatibleTraits.length > 0) {
    restrictedGeneration = true;

    var compatibleChild, compatibleParents, parentIndex, childIndex, compatibleCount;
    incompatibleTraits.forEach((incompatibility) => {
      if (incompatibilities[incompatibility].layerIndex == layerConfigIndex) {
        compatibleChild = [];
        compatibleChild.push(incompatibility);
        compatibleParents = incompatibilities[incompatibility].parents;
        parentIndex = incompatibilities[incompatibility].parentIndex;
        childIndex = incompatibilities[incompatibility].childIndex
        compatibleCount = incompatibilities[incompatibility].maxCount;

        if(compatibleCount == 0) {
          console.log(`All ${compatibleChild} distributed`);
          delete incompatibilities[incompatibility];
        }

      }


    })
  }

  // let layerSizes = allLayerSizes();
  _layers.forEach((layer) => {
    // Fetch compatible traits for current layer based on previous selections
    if (restrictedGeneration && layer.id === parentIndex && compatibleCount > 0) {
      var compatibleTraits = compatibleParents;
      incompatibilities[compatibleChild[0]].maxCount--;
    } else if (restrictedGeneration && layer.id === childIndex && compatibleCount > 0) {
      var compatibleTraits = compatibleChild;
    } else {
      var compatibleTraits = Object.keys(nestLookup.reduce(
        (a, trait) => a[trait], compatibility[layerConfigIndex]
      ));
    }

    let elements = []
    for (let i = 0; i < compatibleTraits.length; i++) {
      for (let j = 0; j < layer.elements.length; j++) {
        if (layer.elements[j].name == compatibleTraits[i]) {
          tempElement = {
            id: layer.elements[j].id,
            name: layer.elements[j].name,
            weight: layer.elements[j].weight
          }
          elements.push(tempElement);
        }
      }
    }

    var totalWeight = 0;

    elements.forEach((element) => {
      totalWeight += allTraitsCount[layer.name][element.name];
    });

    // We keep the random function here to ensure we don't generate all the same layers back to back.
    let random = Math.floor(Math.random() * totalWeight);

    for (var i = 0; i < elements.length; i++) {
      // Check allTraitsCount for the selected element 
      let lookup = allTraitsCount[layer.name][elements[i].name];
      if (lookup > 0) {
        random -= allTraitsCount[layer.name][elements[i].name];
      }
      // Subtract the current weight from random until we reach a sub zero value.
      if (random < 0) {
        // Append new layer information to nestLookup
        nestLookup.push(elements[i].name);
        return randNum.push(
          `${elements[i].id}:${elements[i].name}& ` +
          `${layerVariations ? _variant : ""}` +
          `${layer.bypassDNA ? "?bypassDNA=true" : ""}`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

function countInstances(structure, targetTrait) {
  let count = 0;

  function traverse(obj, path) {
    for (const key in obj) {
      const currentPath = path.concat(key);
      
      if (currentPath.includes(targetTrait)) {
        if (typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
          count++;
        }
      }
      
      
      if (typeof obj[key] === 'object') {
        traverse(obj[key], currentPath);
      }
    }
  }

  traverse(structure, []);
  return count;
}

// For reference
const createDnaOG = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // Subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_imgData.json`, _data);
};

const sortedMetadata = () => {
  let files = fs.readdirSync(`${buildDir}/json`);
  let filenames  = [];
  let allMetadata = [];
  files.forEach(file => {
    const str = file
    const filename = Number(str.split('.').slice(0, -1).join('.'));
    return filenames.push(filename);
  })
  filenames.sort(function(a, b) {
    return a - b;
  });

  for (let i = 0; i < filenames.length; i++) {
    if (!isNaN(filenames[i])) {
      let rawFile = fs.readFileSync(`${basePath}/build/json/${filenames[i]}.json`);
      let data = JSON.parse(rawFile);

      for (let i = 0; i < data.attributes.length; i++) {
        delete data.attributes[i].imgData;
      }

      fs.writeFileSync(`${basePath}/build/json/${data.edition}.json`, JSON.stringify(data, null, 2));
      allMetadata.push(data);
    } 
  }
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, JSON.stringify(allMetadata, null, 2));
  console.log(`Ordered all items numerically in _metadata.json. Saved in ${basePath}/build/json`);
}

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const scaleWeight = (layer, layerWeight) => {
  const incompatibleTraits = Object.keys(incompatibilities);
  const totalWeight = layer.elements.reduce((sum, element) => sum + element.weight, 0);

  // console.log(incompatibleTraits);

  if (exactWeight) {
    if (totalWeight !== layerWeight) {
      throw new Error(`Total weight in ${layer.name} (${totalWeight}) does not match amount specified in 
      layerConfigurations (${layerWeight}). Please adjust weights in ${layer.name} to ensure the add up to ${layerWeight}.`);
    }
    /* Ricky, add logic to warn user if maxCount of trait exceeds their defined weight. Started above, 
    but I don't want to adjust all the layer weights right now to test properly
    */
  } else {
    let allCounts = new Object();
    let maxCount = 0;

    layer.elements.forEach((element) => {
      const scaledWeight = Math.max(1, Math.round((element.weight / totalWeight) * layerWeight));
      maxCount = countInstances(compatibility, element.name);

      allCounts[element.name] = maxCount;

      if (scaledWeight == 0) {
        element.weight = 1;
      } else if (scaledWeight > maxCount) {
        element.weight = maxCount;
      } else {
        element.weight = scaledWeight;
      }      
    });

    if (debugLogs) {
      console.log(`Max counts for ${layer.name}:`);
      console.log(allCounts);
    }

    // Validate and adjust weights to make sure they add up to layerWeight
    let adjustedTotalWeight = layer.elements.reduce((sum, element) => sum + element.weight, 0);
    let weightDifference = layerWeight - adjustedTotalWeight;

    // While there's a difference, adjust weights proportionally
    let isDifference = true;
    let maxTries = 0;
    while (isDifference) {
      if (maxTries > uniqueDnaTorrance) {
        throw new Error(`Weights could not be reconciled at current collection size (${collectionSize})`+
        ` Please review your weights, and adjust.`);
      }
      layer.elements.forEach((element) => {
        if (Math.abs(weightDifference) < 0.0001) {
          isDifference = false;
          return;
        } else if (weightDifference < 0) { 
          let newWeight = element.weight - 1;
          // Ensure that if reducing weight, it doesn't go to zero.
          if (newWeight > 0) {
            element.weight--;
            weightDifference++;
          }
        } else if (weightDifference > 0) {
          let newWeight = element.weight + 1;
          // Ensure that if increasing weight, it doesn't go past maxCount
          if (newWeight <= maxCount) {
            element.weight++;
            weightDifference--;
          }
        } else {
          throw new Error(`This error should only show if math has changed`);
        }
        // Now that all weights are finalized, update 'maxCount' for incompatibilities
        if (incompatibleTraits.length > 0) {
          // console.log(incompatibleTraits);
          incompatibleTraits.forEach((incompatibility) => {
            if (incompatibility == element.name) {
              incompatibilities[incompatibility].maxCount = element.weight;
            }
          })
        }
      });
      maxTries++;
    }
  }
};

const traitCount = (_layers) => {
  let count = new Object();
  _layers.forEach((layer) => {
    let tempCount = {};
    layer.elements.forEach((element) => {
      tempCount[element.name] = element.weight;
    });
    count[layer.name] = tempCount;
  });
  return count;
};

  /* Ricky, assuming you don't entirely ditch the current variant system, 
  at least make it consistent with othe options. should be ?setting=value
  */

const createVariation = (_variations) => {
  let setVariant = [];
  _variations.forEach((variant) => {
    var totalWeight = 0;
    variant.Weight.forEach((Weight) => {
      totalWeight += Weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < variant.Weight.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= variant.Weight[i];
      if (random < 0) {
        return setVariant.push(
          `${variant.name}:${variant.variations[i]}`
        );
      }
    }
  });
  return setVariant.join(DNA_DELIMITER);
};

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    layers.forEach((layer) => {
      let layersOrderSize = layerConfigIndex == 0
        ? layerConfigurations[layerConfigIndex].growEditionSizeTo
        : layerConfigurations[layerConfigIndex].growEditionSizeTo - layerConfigurations[layerConfigIndex - 1].growEditionSizeTo;
      scaleWeight(layer, layersOrderSize);
    });
    allTraitsCount = traitCount(layers);
    // console.log(allTraitsCount);
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {

      let currentEdition = editionCount - 1;
      let remainingInLayersOrder = layerConfigurations[layerConfigIndex].growEditionSizeTo - currentEdition;
      
      let newVariant = createVariation(layerVariations);
      let variant = newVariant.split(':').pop();
      let variantName = newVariant.split(':')[0];

      let newDna = createDnaExact(layers, remainingInLayersOrder, currentEdition, variant, layerConfigIndex) 

      let duplicatesAllowed = (allowDuplicates) ? true : isDnaUnique(dnaList, newDna);

      if (duplicatesAllowed) {
        let results = constructLayerToDna(newDna, layers);

        let variantMetadata = false
        // Add metadata from layers
        results.forEach((layer) => {
          // Deduct selected layers from allTraitscount
          allTraitsCount[layer.name][layer.selectedElement.name]--;

          Object.keys(layer).forEach(key => {
            if(layer.layerVariations !== undefined) {
              variantMetadata = true;
            }
          })

          addAttributes(layer);
        })

        // Add any additional metadata
        extraAttributes.forEach((attr) => {
          attributesList.push(attr);
        });
        if (variantMetadata) {
          attributesList.push({
            trait_type: variantName,
            value: variant,
          });
        }
        if (enableStats) {
          addStats();
          statList.forEach((stat) => {
            attributesList.push(stat);
          });
          statList = [];
        }

        addMetadata(newDna, abstractedIndexes[0]+resumeNum);
        saveMetaDataSingleFile(abstractedIndexes[0]+resumeNum);

        console.log(
          `Created edition: ${abstractedIndexes[0]+resumeNum}, with DNA: ${sha1(
            newDna
          )}`
        );
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  // Ricky, create metadata cache file for imgData, and leave imgData out of regular metadata files
  writeMetaData(JSON.stringify(metadataList, null, 2));
  sortedMetadata();
};

const rarityBreakdown = () => {
  let rawdata = fs.readFileSync(`${basePath}/build/json/_metadata.json`);
  let data = JSON.parse(rawdata);
  let editionSize = data.length;

  let layers = [];
  let layerNames = [];

  // Get layers
  data.forEach((item) => {
    let attributes = item.attributes;
    attributes.forEach((attribute) => {
      let traitType = attribute.trait_type;
      if(!layers.includes(traitType)) {
        let newLayer = [{
          trait: traitType,
          count: 0,
          occurrence: `%`,
        }]
        layers[traitType] = newLayer;
        if(!layerNames.includes(traitType)) {
          layerNames.push(traitType);
        }
      }
    });
  });

  // Count each trait in each layer
  data.forEach((item) => {
    let attributes = item.attributes;
    attributes.forEach((attribute) => {
      let traitType = attribute.trait_type;
      let value = attribute.value;
      if(layers[traitType][0].trait == traitType) {
        layers[traitType][0].trait = value;
        layers[traitType][0].count = 1;
        layers[traitType][0].occurrence = `${((1/editionSize) * 100).toFixed(2)}%`;
      } else {
        let layerExists = false;
        for (let i = 0; i < layers[traitType].length; i++) {
          if(layers[traitType][i].trait == value) {
            layers[traitType][i].count++;
            layers[traitType][i].occurrence = `${((layers[traitType][i].count/editionSize) * 100).toFixed(2)}%`;
            layerExists = true;
            break;
          }
        }
        if(!layerExists) {
          let newTrait = {
            trait: value,
            count: 1,
            occurrence: `${((1/editionSize) * 100).toFixed(2)}%`,
          }
          layers[traitType].push(newTrait);
        }
      }
    }); 
  });

  // Prep export to review data outside of terminal
  let layerExport = [];

  for (let i = 0; i < layerNames.length; i++) {
    let layer = layerNames[i];
    layerExport.push(layer);
    layerExport.push(layers[layer]);
  }

  console.log(layerExport);

}

const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const createPNG = async () => {
  let rawdata = fs.readFileSync(`${basePath}/build/json/_imgData.json`);
  let data = JSON.parse(rawdata);
  let editionSize = data.length;

  debugLogs ? console.log("Clearing canvas") : null;
  ctx.clearRect(0, 0, format.width, format.height);

  if (background.generate) {
    drawBackground();
  }

  const startTime = process.hrtime();
  let singleImageTimeMs = 0;

  let i = 0;
  for (const item of data) {
    i++;
    debugLogs ? console.log("Clearing canvas") : null;
    ctx.clearRect(0, 0, format.width, format.height);

    if (background.generate) {
      drawBackground();
    }

    for (const attr of item.attributes) {
      ctx.globalAlpha = attr.imgData.opacity;
      ctx.globalCompositeOperation = attr.imgData.blend;

      const img = await loadImage(attr.imgData.path);

      ctx.drawImage(img, 0, 0, format.width, format.height);
    }
    
    saveImage(item.edition);
    console.log(`Generated photo for edition ${item.edition}`);

    const elapsedTime = process.hrtime(startTime);
    const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;

    // Calculate time for one image
    if (i === 1) {
      singleImageTimeMs = elapsedMs;
      const totalTimeMs = singleImageTimeMs * editionSize;
      const remainingTimeMs = totalTimeMs - singleImageTimeMs;

      const remainingTimeSeconds = remainingTimeMs / 1000;
      console.log()
      console.log(`Estimated time for remaining ${editionSize - 1} images: ${formatTime(remainingTimeSeconds)}`);
      
      // Wait for 5 seconds before continuing
      await delay(5000);
    }
  }
};

module.exports = { startCreating, buildSetup, getElements, rarityBreakdown, createPNG };
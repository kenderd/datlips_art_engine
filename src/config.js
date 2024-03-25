const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const collectionSize = 100;

// ********* Advanced weight options *********
/* 
* Set this to true if you want to use EXACT weights. 
* Note that your weights must add up to the total number
* you want of that trait.
*/

const exactWeight = false;

// Options: eth, sol, sei
// NOTE: using 'eth' will generate metadata compatible with most EVM chains
const network = NETWORK.eth;

// General metadata
const collectionName = "YEET";
const symbol = "YEET";
const description = "YEET DESCRIPTION";
const baseUri = "ipfs://YEETTESTBABY";

const solanaMetadata = {
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  creators: [
    {
      address: "8DsAhDisG5eYjBwedSiakTKwrYCWpQ4tNDRuZyniMXaX",
      share: 100,
    },
  ],
  collection: {
    name: "Your Collection",
    family: "Your Collection Family",
  }
};

// It's suggested to keep shuffle enabled to avoid the same traits generating for spans of images
const shuffleLayerConfigurations = true;

const layerConfigurations = [
  {
    // NOTE!! growEditionSizeTo should be set to the number of images you want generate within each layer configuration
    growEditionSizeTo: 100, // << This will generate 50 images with this layersOrder
    namePrefix: collectionName,
    description: description,
    layersOrder: [
      { name: "Backgrounds" },
      { name: "FullSets" },
      { name: "SpecialBody" },
      { name: "BaseBody" },
      { name: "BaseHead" },
      { name: "Waterfall" },
      { name: "Body" },
      { name: "EyeHighlights" },
      { name: "Glasses" },
      { name: "Hats" },
      { name: "TopOfTheHead" },
      { name: "Hands" },
    ],
  },
];

const format = {
  width: 512,
  height: 512,
  dpi: 72,
  smoothing: false,
};

const extraMetadata = {};

const extraAttributes = [];

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const enableStats = false;
const statBlocks = [
  /* 
  * These are all examples with different display_types. 
  * Please refer to Opensea metadata standards for visual examples.
  */
  {
    minValue: 1,
    maxValue: 50,
    attribute:
    {
      trait_type: "Stamina", 
      value: 0
    },
  },
  {
    minValue: 1,
    maxValue: 50,
    attribute:
    {
      trait_type: "Stamina", 
      value: 0
    },
  },
  {
    minValue: 1,
    maxValue: 999,
    attribute:
    {
      display_type: "number", 
      trait_type: "Stamina", 
      value: 0
    },
  },
  {
    minValue: 1,
    maxValue: 100,
    attribute:
    {
      display_type: "boost_percentage", 
      trait_type: "Stamina Increase", 
      value: 0
    }, 
  },
  {
    minValue: 25,
    maxValue: 75,
    attribute:
    {
      display_type: "boost_number", 
      trait_type: "Stamina Boost", 
      value: 0
    }, 
  },
];

const debugLogs = false;

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

// Currently disabled
const text = {
  only: true,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: false,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
* Rarity distribution can be adjusted. The main thing to keep in mind
* when editing is the rarities relationship to eachother. 
* Common vs Mythic is 100:1 in the default state, for example.
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const rarity_config = {
  Legendary: 2,
  Epic: 8,
  Rare: 20,
  Common: 100,
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
* Do not use this unless 100% necessary and you understand the risk
* Generating collection in stages leads to potential duplicates. 
* 99% of the time, regenerating is the appropriate option. 
* This is here for the 1%
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const resumeNum = 0;
const importOldDna = false;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
* NOTE: As the name implies, this will allow duplicates to be
* generated in the collection. Do not set this to true unless
* you specifically want duplicates in your collection.
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
const allowDuplicates = false;

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  collectionName,
  symbol,
  network,
  solanaMetadata,
  gif,
  preview_gif,
  resumeNum,
  rarity_config,
  collectionSize,
  exactWeight,
  importOldDna,
  allowDuplicates,
  enableStats,
  statBlocks,
  extraAttributes,
};

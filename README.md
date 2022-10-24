This is a fork of Hashlip's art engine. It is currently a *Work in Progress* as more features are planned to be added. 

🛠️🛠️ Please note that the README is barebones atm as I'm still working on feature implementation, but if you have any questions, please feel free to ask me in the various channels I can be reached. 

<br/>
<br/>

## Relevant links / socials,

[datboi](https://linktr.ee/datboi1337)

<br/>
<br/>

# Additional Features in this fork

## Named rarity weight

- [Use named weights instead of numbers in filename](#use-named-weight-instead-of-filename)
  - [Named weight example](#named-weight-example)

## Exact rarity weight

- [Set trait weight to equal the exact number of times you want that trait in the collection rather than using rng](#use-exact-weight-instead-of-rng)
  - [Exact weight example](#exact-weight-example)

## Layer Variation
- [Assign layerVariations to layers to ensure they match other layers with that variation](#layer-variation-system)
  - [layerVariations example](#layer-variation-example)

## Add stat blocks
- [Assign randomized stats within defined range to each NFT!](#stat-blocks)
  - [Stat blocks examples](#stat-block-examples)

## Add extra attributes
- [Add extra attributes to every NFT](#extra-attributes)
  - [Extra attributes example](#extra-attributes-example)

## Resume creation

- [Generate NFT in stages](#generate-nft-in-stages)
  - [resumeNum Example](#resumenum-example)

## Scaled creation

- [Generate NFT in smaller sets for testing](#generate-nft-in-smaller-sets-for-testing)
  - [scaleSize Example](#scalesize-example)

## Allow duplicate images/metadata

- [Allow duplicate images to be duplicated](#allow-duplicates)

## Define DPI in format

- [Define DPI in addition to resolution](#define-dpi)

## Utils

- [cleanMetadata](#cleanmetadata)
- [removeAttributes](#removeattributes)
- [renameAttributes](#renameattributes)
- [generateOldDna](#generateolddna)
- [recreateAndSortMetadata](#recreateandsortmetadata)
- [rarityFromMetadata](#rarityfrommetadata)

### Notes

- Work in Progress


# Use named weights instead of numbers in filename
This fork gives the option to use a simpler weight system by using common rarity names (Common, Uncommon, Rare, Epic, Legenedary, and Mythic) instead of numbers. Weight will be calculated based on named value.

## Named weight example
This repository is set up to use named weights by default. The layers are already using named weights

You can switch back to using numbered weights by setting `namedWeight` to false in config.js. 

```js
// Set this to true if you want to use named rarity instead of numbers. 
const namedWeight = true;
```
![namedVsNumbered](https://user-images.githubusercontent.com/92766571/179042357-3d045785-807e-48e5-b9bb-c789d146e905.png)

# Use exact weight instead of rng
This fork gives the option to use define exact counts of traits rather than using weight to randomly determine counts of traits. 

## Exact weight example
To use exact weight system, set exactWeight to true in config.js. When this option is enabled, the weight any given trait is set to will be the exact number of times that trait appears in the collection. ie: `trait#50.png` will appear 50 times throughout the collection exactly. <br/>

**PLEASE NOTE**: exactWeight and namedWeight can not be used together at this time! 

```js
const exactWeight = true;
```

# Layer variation system
Use this option to assign a 'variation' to multiple layers. The most common use-case for this option would be ensuring certain traits are the same color or skin pattern. For any trait that has variations, put a placeholder in the normal layer's folder with the desired weight, then put each of it's variations into the layer's '-variant' folder named with the variant name instead of a weight.
Define your variations in the layerVariations const in config.js. <br/>

**NOTE**: If a layer has variations, it must contain *all* the variants. For example, the base images in this fork have 4 variants defined (Blue, Green, Purple, and Red), so any layer using layerVariations must include a variant for each of those colors. 

## Layer variation example
In this fork, there are currently two layers with variations (Arms and Head). If you look at the file structure, you will see each have '-variant' folders with each trait duplicated the number of colors edfined in layerVariations.
Define layerVariations:
```js
const layerVariations = [
  {
    variationCount: 1,
    name: 'Color',
    variations: [
      'Blue',
      'Green',
      'Purple',
      'Red',
    ],
    Weight: [
      35,
      25,
      25,
      15,
    ],
  },
];
```
Determine which layers need variants:
```js
{ name: "Arms", options: {layerVariations: 'Color'} },
```
Base folder for the trait (Arms) as well as it's variant folder (Arms-variant):
<br/>
![b3b893cc92e9779c35cb6e1ebc14c798](https://user-images.githubusercontent.com/92766571/183504630-bf9fc530-318b-42d2-86ac-bdcbceafddb4.png)
<br/>
Base trait folder contents. These files should be named the same way any other trait would be (trait#weight):
<br/>
![41bfc893d8e659dc8177664efbeb1ed7-1](https://user-images.githubusercontent.com/92766571/183504941-9dcb384b-f884-4a3e-b5a4-dc83fdc2aea0.png)
<br/>
Variant folder contents. These files should be named with the traits name (exactly matching that in the base trait folder) followed by a space and the variant's name (the four colors in this case):
<br/>
![316d7b63f6010d123e4b396c4fd32126-1](https://user-images.githubusercontent.com/92766571/183505249-0d752e61-4ed8-46ca-a084-3055f3bf1302.png)
<br/>

# Stat blocks
Add any number of stats to your tokens! All examples are from the [Opensea Metadata Standards](https://docs.opensea.io/docs/metadata-standards). Please visit to see how each display_type will look on Opensea.  

## Stat block examples
To use stat blocks, simply set `enableStats` to 'TRUE' in config.js. 
```js
const enableStats = true;
```
You can randomize the value in each new attribute in `const statBlocks`. You can control the range of the `value` by defining `minValue` & `maxValue`. <br/>
**NOTE**: Leave `value` set to '0' here. If you change it, the generated value may fall outside the range set by `minValue` & `maxValue`.
```js
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
```
The generated trait in the example above will add a trait like this to the metadata:
```js
{
  "display_type": "number",
  "trait_type": "Stamina",
  "value": 84
},
```

# Extra attributes
Allows adding extra *attributes* to the metadata. `extraMetadata` is restricted to only adding things outside the attribute. This functionality allows adding extra information to the attributes so they can be displayed in marketplaces. <br/>

**NOTE**: This will add the *same* information to each NFT's metadata. 

## Extra attributes example
This works similarly to the already present `extraMetadata`, but you can add multiple items. Anything added to this section will be added to every NFT's metadata. 
```js
const extraAttributes = [
  {
    trait_type: "New Trait",
    value: "Extra",
  }
];
```

# Generate NFT in stages
This fork gives the ability to start generation at any number. This can sometimes be useful, but in 99% of cases generation should be done all at once. These options simply provide tools for the other 1%. Utilizing a previous generations dna will help to prevent duplicates from being generated. Please be sure to utilize the oldDna [Util](#generateolddna).

## resumeNum Example
`resumeNum` can be set independantly to simply start edition at a higher number, but if you want to use old dna, your `resumeNum` must be set and it must equal the number of items in _oldDna.json

```js
const resumeNum = 0;
const importOldDna = false;
```

# Generate NFT in smaller sets for testing
Adjusting every `growEditionSizeTo` anytime you want to test something out on a smaller scale can be frustrating. This system allows you to set your `collectionSize` once, then your `growEditionSizeTo` definitions are replaced with scaleSize. Ensure the numbers fed to that function add up to your `collectionSize`, and you can change `toCreateNow` on the fly to whatever scale you want to test. All rarity is scaled where applicable, so no need to make weight adjustments!
## scaleSize Example
By default, this repository is working with a collection of 1000. You can test this feature quickly by simply setting `toCreatNow` to a smaller number.

**NOTE**: This feature can be bypassed by setting `growEditionSizeTo` to numbers vs using `scaleSize`. If you do use this feature, `collectionSize` and `toCreateNow` must match to create the full collection!

**TIP**: To avoid potential scaling issues, you can set your final layersOrder to equal `collectionSize`. 

```js
const collectionSize = 1000;
const toCreateNow = 1000;

const scaleSize = (num) => {
  if (collectionSize === toCreateNow) return num;
  return Math.ceil((num / collectionSize) * toCreateNow);
};
```
# Allow duplicates 
If you want duplicates in your collection, you can set the allowDuplicates flag to true. 
```js
const allowDuplicates = true;
```

# Define DPI 
If you need to adjust your DPI, that has been added as an option in config.js under `format`. 
```js
const format = {
  width: 512,
  height: 512,
  dpi: 72,
  smoothing: false,
};
```

# Utils

## cleanMetadata
This utility gives the option to remove some commonly requested items. Set any to true to remove them from generated metadata. Original metadata is preserved, and clean metadata is saved to build_new/json

```js
let removeDna = true;
let removeEdition = false;
let removeDate = true;
let removeCompiler = false;
```

## removeAttributes
This utility gives the ability to remove any attributes either by trait_type or value. Commonly used to remove 'None', but can be set to remove any attribute. Add each item you'd like removed from the attributes to the `removeValue` and/or `removeTraitType` arrays:

```js
let removeValue = [ "None", "Test" ] //Enter values you want to remove here. (ie: "None")
let removeTraitType = [ "Head" ] //Enter a Traits you want to remove here. (ie: "Head")
```


## renameAttributes
This utility gives the ability to rename any attributes either by trait_type or value. Simply enter the values and/or trait types that you want to replace into `valueBefore` and/or `traitTypeBefore`, and what you want them replaced with in `valueAfter` and/or `traitTypeAfter`.<br/>
**NOTE**: Arrays must be the same length and be in the correct order for replacement to work properly. In the example, "FishHead" will be replaced with "StandardHead", "Purple" will be replaced with "Lavender", etc.

```js
let valueBefore = [ "FishHead", "Purple" ] //Enter old values here
let valueAfter = [ "StandardHead", "Lavender" ] //Enter new values here
let traitTypeBefore = [ "test", "Color" ] //Enter old trait_types here
let traitTypeAfter = [ "Hat", "Skin" ] //Enter new trait_trypes here
```

## generateOldDna
This utility generates a dnaList for import from a previous generation's metadata. As mentioned several times, the better options is typically to regenerate everything; however, this gives the ability to prevent duplicates from being generated based on old information. 

You must place your previously generated _metadata.json file in the build_old folder. 

## recreateAndSortMetadata
This utility recreates all individual metadata files as well as _metadata.json and orders them numerically. This can be useful if _metadata.json was accidentally deleted from the build folder or if you need each item in _metadata.json to be ordered numerically.

No edits necessary to use this util. 

## rarityFromMetadata
This utility counts all traits and calculates their occurence percentages, calculates scores based on each NFT's traits, ranks each NFT by their score, and determines their named rarity (Common, Uncommon, Rare, Epic, Legendary, Mythic). It also enables the ability to add any or all of this information to the metadata itself as it's own element or as an attribute! 

**NOTE**: This utility replaces the old 'rarity.js' script. 'yarn rarity' will now call this utility.
<br/>

**NOTE**: Due to a change in how traits are determined, this will no longer display any 0 qty traits. Be sure to review 'rarityBreakdown' in the rarity folder. 
<br/>

**NOTE**: Any attribute with display_type will not include occurance percentage in the value, even if `includeTraitPercentages` is set to true to avoid issues with displaying properly on marketplaces. 
By default, Rank will be added as an attribute and Rarity will be added as an element to the metadata when running this utility. You can adjust what will be added to the metadata by editing these items: 

```js
const scoreAttribute = false;
const scoreElement = false;

const rankAttribute = false;
const rankElement = true;

const rarityAttribute = true;
const rarityElement = false; 

const includeTraitPercentages = false;
```
scoreAttribute will add a trait to the metadata like:
```js
{
  "trait_type": "rarityScore",
  "value": 173
}
```
rankAttribute will add a trait to the metadata like:
```js
{
  "trait_type": "Rank",
  "value": 29
}
```
rarityAttribute will add a trait to the metadata like:
```js
{
  "trait_type": "Rarity",
  "value": "Rare"
}
```
includeTraitPercentages will add occurence percentages to all other traits like:
```js
{
  "trait_type": "Color",
  "value": "Red (12.00%)"
}
```

<br/>
<br/>
<br/>

🛠️🛠️ Note again that the engine and *especially* documentation are a work in progress. Both will be improved upon further. 

# More features in progress / on the way

## Bring items to the front
Mark specific items to be moved the first n of the collection for sequential minting.
## Add option to mint exact number of specific traits. 
## Build robust nested layer functionality to account for incompatibilities/forced combinations
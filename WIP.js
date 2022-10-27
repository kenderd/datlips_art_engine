/* TODO
============================================================================
High priority, full refactor of code. Should resolve all of these items:
============================================================================
-Build nested layer structure. 
-Fix named weight system. Currently needs a spread of rarities for some reason. 
-Also need to have no chance of a zero generation. Need to combine the named and exact weight systems, and
  have the traits generate exactly the number the named weight system decides. Probably throw some RNG into those 
  numbers so generating a collection twice won't have the same stuff. 
- Still want an option to generate an exact number of a trait when not using exact weights. Maybe a 
different rarityDelimiter? Like if you define a new variable as $, then when #weight, it generates normally,
but when you have $weight, it generated that number exactly?
-Account for variants that may not have all colors. ie: 5 colors, but trait only has 3 colors.
  Make it an option. "Do you want to skip variants that don't exist or pick again?" - "Pick again" should be default. 
- Account for traits across multiple layers with the same name in exact weight system. Unique name was expected, 
but traits like 'None' will have their weights counted across multiple layers. Either exclude duplicate trait
names, or require a delimeter like & and use 'attributeCleanName'.
-Create incompatible layers system.
-Add option to exclude layer from metadata

============================================================================
Low priority stuff, as time permits:
============================================================================
- Util to 'bring to front'. This will enable people to move X number of tokens to the first # in the
collection so they can team Mint or whatever without resorting to minting with tokenId.
- Adjust scaleMints system to use *actual* # of that layerconfig, rather than cumulative. ie: if I want [10,10,10] 
I should be able to set growEditionSizeTo to [10,10,10] not [10,20,30]. Maybe even have option to set them to %?
-1of1 - similar to ultraRare feature, but allow to happen during generation with option to have all normal metadata traits
set to 1of1 name or for just a single '1of1' trait. Create separate util to create new folder structure for them?

*/

/* DONE
-work in resumeNum functionality
-work in toCreateNow functionality
-rework weight system to simply mark the weight as a rarity name (common, rare, etc.) and have rarity automatic
-work in misc utils
- Continue to build on resumeNum and enable a resumted generation? Maybe pull dna from metadata?
-option to not display none in metadata -- Solution: use removeAttribute
-rework weight system to allow exact counts to be used as weights. 
-work in variation functionality
-work in rarity calculations
-option to include rarity in metadata
- option to add numerical trait/attribute. Like a statblock
*/
let {extractTileShadows, extractTiles} = require("./convertors.js");

let config = require("./config.json");

extractTiles("../roguelikeSheet_transparent.png", "../roguelikeSheet_extracted.png", config, (err) => console.error(err));
extractTileShadows("../roguelikeSheet_transparent.png", "../roguelikeSheet_shadows.png", config, (err) => console.error(err));
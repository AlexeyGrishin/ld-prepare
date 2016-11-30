let {extractHeightMaps} = require('./convertors');

let config = require("./config.json");

extractHeightMaps("../roguelikeSheet_shadows.png", "../roguelikeSheet_heights.png", config, (err) => console.error(err));
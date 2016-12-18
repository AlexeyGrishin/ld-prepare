let {map3dToVex} = require('./convertors');
let config = require("./config.json");

map3dToVex("../roguelikeSheet_shadows.png", "./roguelike", config, (err) => console.error(err));
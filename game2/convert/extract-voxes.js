let {map3dToVex, extractTileShadows} = require('./convertors');
let config = require("./config.json");

extractTileShadows("../roguelikeSheet_transparent.png", "../roguelikeSheet_pre_3d.png", config, (err) => {
    if (err) return console.error(err);

    map3dToVex("../roguelikeSheet_pre_3d.png", "./out/tile", config, (err) => console.error(err));
});
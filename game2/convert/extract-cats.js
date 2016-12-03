let {extractTileShadows, extractTiles, extractHeightMaps, prepare3dSprites} = require("./convertors.js");

let config = {
    size: 32,
    pad: 0,
    tiles: [
        {tileNr: 12, projection: 'flatX', projectionCoord: 24},
        {tileNr: 13, projection: 'flatX', projectionCoord: 24},
        {tileNr: 14, projection: 'flatX', projectionCoord: 24},
        {tileNr: 0, projection: 'flatY', projectionCoord: 10, projectionTile: 24},
        {tileNr: 1, projection: 'flatY', projectionCoord: 10, projectionTile: 25},
        {tileNr: 2, projection: 'flatY', projectionCoord: 10, projectionTile: 26},
        {tileNr: 24, projection: 'flatX', projectionCoord: 24},
        {tileNr: 25, projection: 'flatX', projectionCoord: 24},
        {tileNr: 26, projection: 'flatX', projectionCoord: 24},
        {tileNr: 36, projection: 'flatY', projectionCoord: 10, projectionTile: 12},
        {tileNr: 37, projection: 'flatY', projectionCoord: 10, projectionTile: 13},
        {tileNr: 38, projection: 'flatY', projectionCoord: 10, projectionTile: 14},
    ]
};

extractTiles("../cats.png", "../cats_extracted.png", config, (err) => console.error(err));
extractTileShadows("../cats.png", "../cats_shadows.png", config, function (err) {
    if (err) return console.error(err);
    extractHeightMaps("../cats_shadows.png", "../cats_heights.png", config, (err) => console.error(err));
    prepare3dSprites("../cats_shadows.png", "../cats_3d.png", config, (err) => console.error(err));
});

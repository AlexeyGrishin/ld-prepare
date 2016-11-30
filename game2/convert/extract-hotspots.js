let {extractHotspots} = require('./convertors');

extractHotspots("../roguelikeSheet_shadows.png", "../roguelikeSheet_hotspots.png", {size: 16}, (err) => console.error(err));
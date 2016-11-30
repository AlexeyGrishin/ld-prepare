

function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('level1', 'l2.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('roguelikeSheet_transparent_normales', 'roguelikeSheet_transparent_NRM.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);

    game.load.script('shadow1', 'shadow1.js');
    game.load.script('normal', 'normal_test.js');
}

var map;
var treesLayer;
var objectsLayer;
var cursors;

var hero;

var lamp1;
var mask1;
var mask2;

var _cache = {};
function lightGradient(size, rgb, stopColor) {
    var k = size + "_" + rgb;
    return _cache[k] || (_cache[k] = (function() {
            var c = document.createElement('canvas');
            c.setAttribute('width', size*2);
            c.setAttribute('height', size*2);
            var ctx = c.getContext('2d');
            var grad = ctx.createRadialGradient(size, size, size, size, size, 10);
            grad.addColorStop(1, "rgb(" + rgb + ")");
            grad.addColorStop(0.5, "rgba(" + rgb + ",0.5)");
            grad.addColorStop(0, stopColor || "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.arc(size, size, size, 0, Math.PI*2);
            ctx.fill();
            return c;
        })());
}


function drawLightSource1(bitmap, lights) {
    bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
    bitmap.context.fillStyle = "rgba(255,255,255,0)";
    bitmap.context.fillRect(0, 0, bitmap.width, bitmap.height);
    lights.forEach(function (light) {
        var gradient = lightGradient(light.radius, "255,255,240", "rgba(255,255,240,0)");
        bitmap.context.drawImage(gradient, light.x - light.radius, light.y - light.radius);
    });
}

function sign(dk) {
    return dk === 0 ? 0 : (dk > 0) ? 1 : -1;
}

function updateFigure(fig) {
    var lines = [];
    for (var i = 0; i < fig.points.length; i++) {
        lines.push({start: fig.points[i], end: fig.points[(i+1)%fig.points.length]});
    }
    fig.lines = lines.map(updateLine);
    for (var i = 0; i < fig.lines.length; i++) {
        var l1 = fig.lines[i];
        var l2 = fig.lines[(i+1)%fig.lines.length];
        var p1, p2;
        //console.log(l1.pixBeyondEnd, l2.pixBeyondBegin, l2.start, l1.end);
        l1.pixMiddle = {
            x: (l1.pixBeyondEnd.x + l2.pixBeyondBegin.x)/2,
            y: (l1.pixBeyondEnd.y + l2.pixBeyondBegin.y)/2
        }
    }
    return fig;
}

function updateLine(line) {
    line.dx = line.end.x - line.start.x;
    line.sx = sign(line.dx);
    line.dy = line.end.y - line.start.y;
    line.sy = sign(line.dy);
    line.k = line.dx / line.dy;
    line.horizontal = line.dy === 0;
    line.vertical = line.dx === 0;
    line.pixBeyondBegin = line.vertical ? {
        x: line.start.x, y: line.start.y-line.sy
    } : {
        x: line.start.x-line.sx, y: line.start.y - line.sx/line.k
    };
    line.pixBeyondEnd = line.vertical ? {
        x: line.end.x, y: line.end.y+line.sy
    } : {
        x: line.end.x+line.sx, y: line.end.y + line.sx/line.k
    };

    line.pixBeyondBegin.myLine = line;
    line.pixBeyondEnd.myLine = line;
    return line;
}



//todo: in phas'er's pointonline there is strict equality
function pointOnLine(point, line) {
    return Phaser.Math.fuzzyEqual((point.x - line.start.x) * (line.end.y - line.start.y), (line.end.x - line.start.x) * (point.y - line.start.y));
}

function pointOnSegment(point, line) {
    var xMin = Math.min(line.start.x, line.end.x);
    var xMax = Math.max(line.start.x, line.end.x);
    var yMin = Math.min(line.start.y, line.end.y);
    var yMax = Math.max(line.start.y, line.end.y);

    return (pointOnLine(point, line) && (point.x >= xMin && point.x <= xMax) && (point.y >= yMin && point.y <= yMax));

}

function getShadowRays(light, objects) {

    var points = [];
    var lines = [];
    objects.forEach(function(o) {
        o.lines.forEach(function(line, idx) {
            lines.push(line);
            points.push(line.start);
            points.push(line.pixMiddle);
        });
    });
    points.push({x:0,y:0});
    points.push({x:game.world.width,y:0});
    points.push({x:0,y:game.world.height});
    points.push({x:game.world.width,y:game.world.height});
    lines.push({start: {x:0,y:0}, end: {x:game.world.width, y: 0}});
    lines.push({start: {x:0,y:0}, end: {x:0, y: game.world.height}});
    lines.push({start: {x:0,y:game.world.height}, end: {x:game.world.width, y: game.world.height}});
    lines.push({start: {x:game.world.width, y:0}, end: {x:game.world.width, y: game.world.height}});
    var targetPoints = [];
    points.forEach(function(p, idx) {
        //raycast, i.e. find closest intersection with
        var ray = new Phaser.Line(light.x, light.y, p.x, p.y);
        var closest = {distance: 999999};
        if (idx == 5) {
            //p._debug = true;
        }
        if (p._debug) {
            console.log("ray", ray);
        }
        //console.log("ray", ray);
        lines.forEach(function(line, lidx) {
            //todo: profiler: hot
            //how can optimize - for each line calculate from/to angles, check angle to point before checking real intersection
            //  sort points and lines by start-angle (normalize angles, from 0 to 2*pi),
            var intersection = Phaser.Line.intersects(ray, line, false);
            /*if (intersection) {
             console.log(intersection, line.start.x, line.start.y, "-", line.end.x, line.end.y);
             console.log(new Phaser.Line(line.start.x, line.start.y, line.end.x, line.end.y).pointOnSegment(intersection.x, intersection.y));
             }*/
            var sameDirection = intersection ? sign(intersection.x - light.x) == sign(p.x - light.x) && sign(intersection.y - light.y) == sign(p.y - light.y) : false;
            if (p._debug && lidx == 1) {
                console.log("check intersection with ", (line.start), "-", (line.end), " -> ", intersection,
                    "samedir=", sameDirection,
                    "pos=", pointOnSegment(intersection, line));
            }
            if (intersection && sameDirection && pointOnSegment(intersection, line)) {   //todo: optimize
                var dist = Phaser.Point.distance(light, intersection);
                if (p._debug) {
                    console.log("intersects on", intersection, "dist=", dist);
                }
                if (closest.distance > dist) {
                    closest = {point: intersection, distance: dist};
                }

            }
        });
        if (closest.point) {
            targetPoints.push(closest.point);
        } else {
            console.warn("no intersection point for ray ", ray);
        }

        if (p._debug) {

            bitmap.context.fillStyle = "red";
            bitmap.context.strokeStyle = "purple";
            bitmap.context.beginPath();
            bitmap.context.moveTo(ray.start.x, ray.start.y);
            bitmap.context.lineTo(closest.point.x, closest.point.y);
            bitmap.context.stroke();
            bitmap.context.beginPath();
            console.log(closest.point);
            bitmap.context.fillRect(closest.point.x-2, closest.point.y-2, 4, 4);
        }
    });
    targetPoints = targetPoints.map(function(p) {
        p.angleToLight = normalizeAngle(p.angle(light));
        p.distanceToLight = p.distance(light);
        return p;
    }).sort(function(p1,p2) { return p1.angleToLight - p2.angleToLight; });
    //console.log(targetPoints);

    return targetPoints;
}

function normalizeAngle(ang) {
    while (ang < 0) ang += Math.PI*2;
    while (ang >= Math.PI*2) ang -= Math.PI*2;
    return ang;
}


function drawShadows1(bitmap, lights, objects) {
    bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
    bitmap.context.fillStyle = "rgba(0,0,0,0.5)";
    bitmap.context.fillRect(0, 0, bitmap.width, bitmap.height);

    lights.forEach(function(light) {
        var gradient = lightGradient(light.distance, "255,255,255");
        bitmap.context.drawImage(gradient, light.x-light.distance, light.y-light.distance);

        /*
         можно перейти к радиальной системе координат. тогда довольно легко находить с каким отрезком есть пересечение.
         т.е. бьем все на отрезки, до каждой точки считаем угол/расстояние от источника света. для каждой надо брать точку на пиксель влевоЭвправо по отрезку, и считать вплоть до пересечения с границей карты
         по
         */

        function toRadial(point) {
            if (point.start && point.end) {
                return {start: toRadial(point.start), end: toRadial(point.end), orig: point};
            }
            var dist = Math.sqrt((point.x - light.x)*(point.x - light.x) + (point.y - light.y)*(point.y - light.y));
            var angle = Math.atan2(point.x - light.x, point.y - light.y);
            return {angle: angle, distance: distance, orig: point};
        }

        var points = [];
        var lines = [];
        objects.forEach(function(o) {
            o.lines.forEach(function(line, idx) {
                lines.push(line);
                if (idx == -1) {
                    bitmap.context.strokeStyle = "purple";
                    bitmap.context.moveTo(line.start.x, line.start.y);
                    bitmap.context.lineTo(line.end.x, line.end.y);
                    bitmap.context.stroke();
                    bitmap.context.fillStyle = "red";
                    bitmap.context.beginPath();
                    //bitmap.context.arc(line.pixBeyondBegin.x, line.pixBeyondBegin.y, 2, 0, Math.PI * 2);
                    bitmap.context.fill();
                    bitmap.context.beginPath();
                    bitmap.context.fillStyle = "blue";
                    //bitmap.context.arc(line.pixBeyondEnd.x, line.pixBeyondEnd.y, 2, 0, Math.PI * 2);
                    bitmap.context.fill();
                    bitmap.context.beginPath();
                    bitmap.context.fillStyle = "red";
                    //bitmap.context.fillRect(line.start.x-2, line.start.y-2, 4, 4);
                    bitmap.context.fillRect(line.pixMiddle.x-2, line.pixMiddle.y-2, 4, 4);
                    line.pixMiddle._debug = true;

                }
                points.push(line.start);
                points.push(line.pixMiddle);
                //points.push(line.pixBeyondBegin);
                //points.push(line.pixBeyondEnd);
            });
        });
        points.push({x:0,y:0});
        points.push({x:game.world.width,y:0});
        points.push({x:0,y:game.world.height});
        points.push({x:game.world.width,y:game.world.height});
        lines.push({start: {x:0,y:0}, end: {x:game.world.width, y: 0}});
        lines.push({start: {x:0,y:0}, end: {x:0, y: game.world.height}});
        lines.push({start: {x:0,y:game.world.height}, end: {x:game.world.width, y: game.world.height}});
        lines.push({start: {x:game.world.width, y:0}, end: {x:game.world.width, y: game.world.height}});
        var targetPoints = [];
        points.forEach(function(p, idx) {
            //raycast, i.e. find closest intersection with
            var ray = new Phaser.Line(light.x, light.y, p.x, p.y);
            var closest = {distance: 999999};
            if (idx == 5) {
                //p._debug = true;
            }
            if (p._debug) {
                console.log("ray", ray);
            }
            //console.log("ray", ray);
            lines.forEach(function(line, lidx) {
                //todo: profiler: hot
                //how can optimize - for each line calculate from/to angles, check angle to point before checking real intersection
                //use, i think, some middle point between end one and begin one. not both
                //
                var intersection = Phaser.Line.intersects(ray, line, false);
                /*if (intersection) {
                 console.log(intersection, line.start.x, line.start.y, "-", line.end.x, line.end.y);
                 console.log(new Phaser.Line(line.start.x, line.start.y, line.end.x, line.end.y).pointOnSegment(intersection.x, intersection.y));
                 }*/
                var sameDirection = intersection ? sign(intersection.x - light.x) == sign(p.x - light.x) && sign(intersection.y - light.y) == sign(p.y - light.y) : false;
                if (p._debug && lidx == 1) {
                    console.log("check intersection with ", (line.start), "-", (line.end), " -> ", intersection,
                        "samedir=", sameDirection,
                        "pos=", pointOnSegment(intersection, line));
                }
                if (intersection && sameDirection && pointOnSegment(intersection, line)) {   //todo: optimize
                    var dist = Phaser.Point.distance(light, intersection);
                    if (p._debug) {
                        console.log("intersects on", intersection, "dist=", dist);
                    }
                    if (closest.distance > dist) {
                        closest = {point: intersection, distance: dist};
                    }

                }
            });
            if (closest.point) {
                targetPoints.push(closest.point);
            } else {
                console.warn("no intersection point for ray ", ray);
            }

            if (p._debug) {

                bitmap.context.fillStyle = "red";
                bitmap.context.strokeStyle = "purple";
                bitmap.context.beginPath();
                bitmap.context.moveTo(ray.start.x, ray.start.y);
                bitmap.context.lineTo(closest.point.x, closest.point.y);
                bitmap.context.stroke();
                bitmap.context.beginPath();
                console.log(closest.point);
                bitmap.context.fillRect(closest.point.x-2, closest.point.y-2, 4, 4);
            }
        });
        targetPoints = targetPoints.map(function(p) {
            p.angleToLight = p.angle(light);
            return p;
        }).sort(function(p1,p2) { return p1.angleToLight - p2.angleToLight; });
        //console.log(targetPoints);

        var targetTriangles = [];
        for (var i = 0; i < targetPoints.length; i++) {
            var triangle = {points: [light, targetPoints[i], targetPoints[(i+1)%targetPoints.length]]};
            targetTriangles.push(triangle);
        }
        bitmap.context.fillStyle = "rgba(255,255,255,0.5)";
        bitmap.context.strokeWidth=1;
        bitmap.context.strokeStyle="red";
        //todo: profiler: hot
        /*
         targetTriangles.forEach(function(tr) {
         //console.log(tr);
         bitmap.context.beginPath();
         bitmap.context.moveTo(tr.points[0].x|0, tr.points[0].y|0);
         bitmap.context.lineTo(tr.points[1].x|0, tr.points[1].y|0);
         bitmap.context.lineTo(tr.points[2].x|0, tr.points[2].y|0);
         bitmap.context.fill();
         //bitmap.context.stroke();
         });*/

        bitmap.context.beginPath();
        bitmap.context.moveTo(targetPoints[0].x|0, targetPoints[0].y|0);
        targetPoints.slice(1).forEach(function(p) {
            bitmap.context.lineTo(p.x|0, p.y|0);
        });
        bitmap.context.fill();

        /*
         кое-как работает, но не очень красиво. есть какие-то серые полосы вдоль лучей. может быть лучей слишком много, хватило бы и меньше.
         пересечение теней ненатуральное.
         треугольники самих обхектов то рисуются, то нет.
         фпс просел до 30. ужос!
         вообще конкретно для этого примера лучше было б рисовать тени. имхо.
         но вообще стоит отрисовку отдать шейдерам
         c 3 источниками симпатичнее.
         */

    });

}

function create1() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#000000';
    map = game.add.tilemap('level1');

    map.addTilesetImage('roguelikeSheet_transparent');

    var bgLayer = map.createLayer('bg');
    treesLayer = map.createLayer('trees');
    objectsLayer = map.createLayer('objects');
    map.setCollisionByExclusion([], true, treesLayer);
    map.setCollisionByExclusion([], true, objectsLayer);

    bgLayer.resizeWorld();


    cursors = game.input.keyboard.createCursorKeys();

    mask1 = game.add.bitmapData(game.camera.width, game.camera.height);
    mask2 = game.add.bitmapData(game.camera.width, game.camera.height);

    var img = game.add.image(0, 0, mask1);
    //todo: if multuply - we see the shadows/lights. if not multiply - see light as is
    //todo: separate bitmap for light sources
    img.blendMode = Phaser.blendModes.MULTIPLY;

    var img2 = game.add.image(0, 0, mask2);

}

var shadow1Filter;
var normalFilter;

function create2() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#000000';
    map = game.add.tilemap('level1');

    map.addTilesetImage('roguelikeSheet_transparent');

    var bgLayer = map.createLayer('bg');
    treesLayer = map.createLayer('trees');
    objectsLayer = map.createLayer('objects');
    map.setCollisionByExclusion([], true, treesLayer);
    map.setCollisionByExclusion([], true, objectsLayer);

    bgLayer.resizeWorld();

    shadow1Filter = game.add.filter('Shadow1');
    normalFilter = game.add.filter('NormalTest');
    game.world.filters = [
        shadow1Filter,
        normalFilter
    ];
    //console.log(game.camera.width, game.camera.height);

    var shadowBitmap = game.add.bitmapData(1024, 4);

    initLinesTexture2(shadowBitmap, treesLayer.getTiles(0, 0, 20*16, 20*16, true).map(treeToObj).map(updateFigure));
    var tempSprite = game.add.sprite(320, 320, shadowBitmap);

    var normalesBitmap = game.add.bitmapData(512, 512);
    initNormalesMap(normalesBitmap, treesLayer.getTiles(0, 0, 20*16, 20*16, true));
    var tempSpriteN = game.add.sprite(320, 320, normalesBitmap);
    //tempSpriteN.blendMode = PIXI.blendModes.ADD;
    
    shadow1Filter.uniforms.iChannel1.value = tempSprite.texture;
    shadow1Filter.uniforms.iChannel1.textureData = {
        nearest: true
    };//width:128, height:128};

    normalFilter.setup(tempSpriteN.texture);
    normalFilter.setResolution(512, 512);

    //shadowBitmap.addToWorld(22222,22222);

    game.input.mousePointer.x = 160;

    //console.log(shadowBitmap.getPixel(11,20).r);

    //console.log(shadowBitmap);
    //game.renderer.blendModeManager.setBlendMode(PIXI.blendModes.SCREEN);
    //console.log(game.renderer);
    //game.world.blendMode = PIXI.blendModes.ADD;

}

function initNormalesMap(bitmap, tiles) {
    var nrm = game.cache.getImage("roguelikeSheet_transparent_normales");
    var orig = game.add.bitmapData(968,526);
    orig.load(game.cache.getImage("roguelikeSheet_transparent"));

    tiles.forEach(function(tile) {
        var frame = game.cache.getFrameByIndex("roguelikeSheet_transparent_normales", tile.index-1);

        bitmap.copyRect(nrm, frame.getRect(), tile.x*16, tile.y*16);
        bitmap.update(0, 0, bitmap.width, bitmap.height);
        //todo: very inefficient
        //orig.update(frame.x, frame.y, frame.width, frame.height);

        //console.log(frame, orig.getPixel(frame.x, frame.y))
        for (var x = frame.x; x <= frame.x+frame.width; x++) {
            for (var y = frame.y; y <= frame.x+frame.height; y++) {

                if (orig.getPixel(x, y).a == 0) {
                    bitmap.setPixel32(tile.x*16 + (x-frame.x), tile.y*16 + (y-frame.y), 0, 0, 0, 0, false);
                } else {
                    //console.log('leave pixl', bitmap.getPixel(tile.x*16 + (x-frame.x), tile.y*16 + (y-frame.y)));
                }
            }
        }
        bitmap.setPixel32(0, 0, 0, 0, 0, 0);
    });
}

function initLinesTexture2(bitmap, objs) {
    var idx = 0;
    //xyba -> 256? not so small?
    
    objs.forEach(function(o) {
        o.lines.forEach(function(line) {
            bitmap.setPixel32(idx, 0, line.start.x >> 8, line.start.x & 0xff, 0, 255, false);
            bitmap.setPixel32(idx, 1, line.start.y >>8, line.start.y & 0xff, 0, 255, false);
            bitmap.setPixel32(idx, 2, line.end.x >> 8, line.end.x & 0xff, 0, 255, false);
            bitmap.setPixel32(idx, 3,  line.end.y >>8, line.end.y & 0xff, 0, 255, false);
            idx++;        
        });
    });
    bitmap.setPixel32(1023, 0, 10, 0, 0, 10, true);    //to putImageData - don't know better way

}

function updateShadows2(lights, objects) {
    //todo: 1 light for now
    var count = 0;
    objects.forEach(function(o) {
        count += o.lines.length;
    });
    shadow1Filter.uniforms.linesCount.value = count;
    
    
    //var points = getShadowRays(lights[0], objects);
    //console.log(points);


    //way1: create texture like 1024x128, and for each light put angle/360*1024 with distance to shadow
    //way2: create texture and put each point in separate pixel (r=x g=y z=distance a=angle), so we may find two bounding points via binary search.
        //dis: we have only 256 values, i.e. 1/256 of full circle, i.e. > 1 angle precision. For way1 precision could be bigger
        //workaround: use 2 vars, like rg, to keep 256*256 different values
    //way3: put lines into texture (xy->zw), lights to uniforms. so for each point need to calculate - is some line on way from it to light
    //          looks a bit expensive. as we can calculate angle from point to light, we may keep lines in texture as (angle+distance) pair instead of xy to lookup lines quickly.
    
}

function fillTo(count, array) {
    for (var i = 0; i < count-array.length; i++) {
        array.push(array[0]);
    }
    return array;
}


function update2() {
    trackMouse();
    var lights = [
        {x: sunX, y: 100, distance: 600, radius: 30},
        {x: sunX+5, y: 100, distance: 600, radius: 3},
        {x: sunX+10, y: 100, distance: 600, radius: 3},
        {x: sunX-5, y: 100, distance: 600, radius: 3},
        {x: sunX-10, y: 100, distance: 600, radius: 3}
    ];
    var objs = treesLayer.getTiles(0, 0, 20*16, 20*16, true).map(treeToObj); //[
    //{points: [{x: 7*16+8, y: 12*16}, {x: 7*16+16, y: 12*16+16}, {x: 7*16, y:12*16+16}]},

    //]
    objs = objs.map(updateFigure);
    updateShadows2(lights, objs);
    shadow1Filter.uniforms.lightsCount.value = lights.length;
    shadow1Filter.uniforms.lightCoords.value = lights.reduce(function(a, l) { return a.concat([l.x, l.y])}, []);
    shadow1Filter.uniforms.lightSize.value = lights.reduce(function(a, l) { return a.concat([l.distance, l.radius])}, []);
    shadow1Filter.update();

    normalFilter.updateLight(lights[0].x, lights[0].y);
    normalFilter.update();

};


var doDirty = true;

var sunX = 229;

function treeToObj(treeTile) {
    switch (treeTile.index) {
        case 623: return {points: [
            {x: treeTile.worldX+6, y: treeTile.worldY},
            {x: treeTile.worldX+10, y: treeTile.worldY},
            {x: treeTile.worldX+10, y: treeTile.worldY+6},
            {x: treeTile.worldX+16, y: treeTile.worldY+6},
            {x: treeTile.worldX+16, y: treeTile.worldY+10},
            {x: treeTile.worldX+10, y: treeTile.worldY+10},
            {x: treeTile.worldX+10, y: treeTile.worldY+16},
            {x: treeTile.worldX+6, y: treeTile.worldY+16},
            {x: treeTile.worldX+6, y: treeTile.worldY+10},
            {x: treeTile.worldX, y: treeTile.worldY+10},
            {x: treeTile.worldX, y: treeTile.worldY+6},
            {x: treeTile.worldX+6, y: treeTile.worldY+6}
        ]};
        case 1360:
        case 1364:
        case 1361:
            return {points: [
            {x: treeTile.worldX, y: treeTile.worldY+4},
            {x: treeTile.worldX+16, y: treeTile.worldY+4},
            {x: treeTile.worldX+16, y: treeTile.worldY+16},
            {x: treeTile.worldX, y: treeTile.worldY+16},
        ]};
        case 1362:
            return {points: [
                {x: treeTile.worldX+16, y: treeTile.worldY},
                {x: treeTile.worldX+12, y: treeTile.worldY},
                {x: treeTile.worldX+12, y: treeTile.worldY+16},
                {x: treeTile.worldX+16, y: treeTile.worldY+16},
            ]};
        case 1363:
            return {points: [
                {x: treeTile.worldX, y: treeTile.worldY},
                {x: treeTile.worldX+4, y: treeTile.worldY},
                {x: treeTile.worldX+4, y: treeTile.worldY+16},
                {x: treeTile.worldX, y: treeTile.worldY+16},
            ]};
        case 532:
            return {points: [
                {x: treeTile.worldX, y: treeTile.worldY+16},
                {x: treeTile.worldX+8, y: treeTile.worldY},
                {x: treeTile.worldX+16, y: treeTile.worldY+16}
            ]};
        case 617:
            return {points: [
                {x: treeTile.worldX, y: treeTile.worldY+16},
                {x: treeTile.worldX+16, y: treeTile.worldY},
                {x: treeTile.worldX+16, y: treeTile.worldY+16},
            ]};
        case 618:
            return {points: [
                {x: treeTile.worldX, y: treeTile.worldY},
                {x: treeTile.worldX+16, y: treeTile.worldY+16},
                {x: treeTile.worldX, y: treeTile.worldY+16},
            ]};
        case 529:
            return {
                points: [
                    {x: treeTile.worldX, y: treeTile.worldY + 4},
                    {x: treeTile.worldX+4, y: treeTile.worldY},
                    {x: treeTile.worldX+16-4, y: treeTile.worldY},
                    {x: treeTile.worldX+16, y: treeTile.worldY+4},
                    {x: treeTile.worldX+16, y: treeTile.worldY+12},
                    {x: treeTile.worldX+10, y: treeTile.worldY+12},
                    {x: treeTile.worldX+10, y: treeTile.worldY+16},
                    {x: treeTile.worldX+6, y: treeTile.worldY+16},
                    {x: treeTile.worldX+6, y: treeTile.worldY+12},
                    {x: treeTile.worldX, y: treeTile.worldY+12},

                ]
            }
        default:
            return {points: [
                {x: treeTile.worldX, y: treeTile.worldY},
                {x: treeTile.worldX+16, y: treeTile.worldY},
                {x: treeTile.worldX+16, y: treeTile.worldY+16},
                {x: treeTile.worldX, y: treeTile.worldY+16},

            ]};
    }

}

function trackMouse() {
    if (game.input.mousePointer.x != sunX) {
        sunX = game.input.mousePointer.x;
        doDirty = true;
    }
}

function update1() {
    trackMouse();
    var lights = [
        {x: sunX, y: 100, distance: 200, radius: 30},
        {x: sunX+5, y: 100, distance: 200, radius: 3},
        {x: sunX+10, y: 100, distance: 200, radius: 3},
        {x: sunX-5, y: 100, distance: 200, radius: 3},
        {x: sunX-10, y: 100, distance: 200, radius: 3}
    ];
    var objs = treesLayer.getTiles(0, 0, 20*16, 20*16, true).map(treeToObj); //[
    //{points: [{x: 7*16+8, y: 12*16}, {x: 7*16+16, y: 12*16+16}, {x: 7*16, y:12*16+16}]},

    //]
    objs = objs.map(updateFigure);

    if (doDirty) {
        drawShadows1(mask1, lights, objs);
        drawLightSource1(mask2, lights);
        mask1.dirty = doDirty;
        mask2.dirty = doDirty;
        doDirty = false;
    }
}


function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    game.debug.text(sunX, 32, game.world.height-32);
}

function debugRender2() {
    debugRender1();
}

/*
 plan:
 1. simplify, optimize for canvas case (make it look good)
 2. move rendering to shader
 3. try normal maps as well
 4. try different tree forms
 5. try pseudo-3d with heightmaps - same, start from canvas, end with shaders


 */
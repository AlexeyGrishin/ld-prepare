const AnimationFrames = {
    "rtp": {
        "worker1": 0,
        "worker_work1": 1,
        "worker_work2": 2,
        "tool1": 3,
        "tool2": 4,
        "worker_jump1": 5,
        "worker_jump2": 6,
        "worker_jump3": 7,
        "worker_jump4": 8,
        "worker_walk1": 9,
        "worker_walk2": 10,
        "worker_walk3": 11,
        "bag1": 12,
        "bag2": 13,
        "bag3": 14,
        "ground1": 15,
        "ground2": 16,
        "ground_top1": 17,
        "ground_top2": 18,
        "ground_top3": 19,
        "big_stone": 20,
        "small_stone": 21,
        "tree1": 22,
        "tree2": 23,
        "building1": 24,
        "building2": 25,
        "well1": 26,
        "catapult1": 27,
        "catapult_fire1": 28,
        "catapult_fire2": 29,
        "catapult_fire3": 30
    },
    "rtp2": {
        "sworcher1": 0,
        "sworcher_walk1": 1,
        "sworcher_walk2": 2,
        "sworcher_attack1": 3,
        "sworcher_attack2": 4,
        "sworcher_attack3": 5,
        "sworcher_attack4": 6,
        "archer1": 7,
        "archer_walk1": 8,
        "archer_walk2": 9,
        "archer_ready1": 10,
        "archer_ready2": 11,
        "archer_ready3": 12,
        "archer_ready4": 13,
        "archer_ready5": 14,
        "archer_afterfire1": 15,
        "archer_afterfire2": 16,
        "archer_afterfire3": 17,
    }
};


function preload() {
    game.load.spritesheet("rtp", "rtp.png", 16, 16);
    game.load.spritesheet("rtp2", "rtp2.png", 16, 16);
    game.load.tilemap('level1', 'l1.json', null, Phaser.Tilemap.TILED_JSON);
}

let state = {};

class Component {

    constructor() {
        this.sprite = null;
    }

    attachTo(sprite) {
        this.sprite = sprite;
        this.sprite.events.onDestroy.addOnce(this.detach, this);
        this.setSelf(sprite);
        this.onAttach();
        return this;
    }

    setSelf(sprite) {throw new Error("override")}
    resetSelf(sprite) {throw new Error("override")}

    onAttach() {}
    onDetach() {}
    onUpdate() {}

    detach() {
        this.resetSelf(this.sprite);
        this.sprite.events.onDestroy.remove(this.detach, this);
        this.sprite = null;
        this.onDetach();
    }
}

class ComponentableSprite extends Phaser.Sprite {
    constructor(...args) {
        super(...args);
        this.data.components = this.componentClasses.map(kls => (new kls).attachTo(this));
    }

    get componentClasses() { return [];}

    update() {
        this.updateBeforeComponents();
        for (let c of this.data.components) c.onUpdate();
        this.updateAfterComponents();
    }

    updateAfterComponents() {}
    updateBeforeComponents() {}
}

class Destroyable extends Component {
    constructor() {
      super();
    }
}

class Selectable extends Component {
    constructor() {
        super();
    }

    static getSelf(sprite) { return sprite.data.selectable; }
    setSelf(sprite) { sprite.data.selectable = this;}
    resetSelf(sprite) { sprite.data.selectable = null;}

    onAttach() {
        this.sprite.inputEnabled = true;
        this.sprite.events.onInputDown.add(this.onClick, this);
    }

    static setSelected(sprite) {
        if (state.selected) {
            Selectable.getSelf(state.selected).onDeselect();
        }
        state.selected = sprite;
        if (state.selected) {
            Selectable.getSelf(state.selected).onSelect();
        }
    }

    onDeselect() {
        this.sprite.tint = 0xffffff;
    }

    onSelect() {
        this.sprite.tint = 0xff0000;
    }

    onClick() {
        Selectable.setSelected(this.sprite);
    }
}

class Walkable extends Component {
    static getSelf(sprite) { return sprite.data.walkable; }
    setSelf(sprite) { sprite.data.walkable = this;}
    resetSelf(sprite) { sprite.data.walkable = null;}

    onAttach() {

    }

    onDetach() {

    }

    perform(action, dx, dy) {

    }

    onUpdate() {
        this.sprite.scale.set(this.direction === 'left' ? -1 : 1, 1);
    }

}

class PathFinder extends Component {
    static getSelf(sprite) { return sprite.data.pathf; }
    setSelf(sprite) { sprite.data.pathf = this;}
    resetSelf(sprite) { sprite.data.pathf = null;}
}

class Town extends Phaser.Sprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.building1);
        this.side = side;
    }
}

class Worker extends ComponentableSprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.worker1);
        this.side = side;
        this.animations.add('walk', [AnimationFrames.rtp.worker1, AnimationFrames.rtp.worker_walk1, AnimationFrames.rtp.worker_walk2, AnimationFrames.rtp.worker_walk3], 16, true);
        this.animations.add('work', [AnimationFrames.rtp.worker_work1, AnimationFrames.rtp.worker_work1], 16, true);
        this.direction = 'right';
    }

    get componentClasses() { return [Selectable, Walkable]}
}

class Swordsman extends ComponentableSprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp2', AnimationFrames.rtp2.sworcher1);
        this.side = side;
        this.animations.add('walk', [AnimationFrames.rtp2.sworcher1, AnimationFrames.rtp2.sworcher_walk1, AnimationFrames.rtp2.sworcher_walk2], 16, true);
        this.animations.add('attack', [AnimationFrames.rtp2.sworcher_attack1, AnimationFrames.rtp2.sworcher_attack2, AnimationFrames.rtp2.sworcher_attack3, AnimationFrames.rtp2.sworcher_attack], 16, true);
        this.direction = 'right';
    }

    get componentClasses() { return [Selectable, Walkable]}

}

function waypointsSimple(map) {
    let points = [];
    let ID = 1;

    map.forEach((tile) => {
        if (tile.index === -1) return;
        let point = {x: tile.x, y: tile.y, waysfromhere: [], waystohere: [], id: ID++};
        points.push(point);
        tile.point = point;
    },0, 0, 0, map.width, map.height);

    //very unoptimal
    let nei, way;

    function addWay(from, toTile, way) {
        if (!toTile || toTile.index === -1) return false;
        let to = toTile.point;
        way.from = from;
        way.to = to;
        from.waysfromhere.push(way);
        to.waystohere.push(way);
        return true;
    }

    for (let p1 of points) {
        //check left
        if (!addWay(p1, map.getTile(p1.x-1, p1.y), {action: 'move', dx: -1, dy: 0})) {
            //check fall
            for (let y = p1.y + 1; y < map.height; y++) {
                if (addWay(p1, map.getTile(p1.x-1, y), {action: 'fall', dx: -1, dy: 0})) break;
            }
        }
        //check right
        if (!addWay(p1, map.getTile(p1.x+1, p1.y), {action: 'move', dx: +1, dy: 0})) {
            //check fall
            for (let y = p1.y + 1; y < map.height; y++) {
                if (addWay(p1, map.getTile(p1.x+1, y), {action: 'fall', dx: +1, dy: 0})) break;
            }
        }
        for (let y = p1.y - 1; y >= 0; y--) {
            if (map.getTile(p1.x, y)) break;
            if (map.getTile(p1.x-1, y) && !map.getTile(p1.x-1,y-1)) {
                addWay(p1, map.getTile(p1.x-1, y), {action: 'jump', dx:-1, dy: p1.y-y});
            }
            if (map.getTile(p1.x+1, y) && !map.getTile(p1.x+1,y-1)) {
                addWay(p1, map.getTile(p1.x+1, y), {action: 'jump', dx:+1, dy: p1.y-y});
            }
        }
    }
    return points;
}

function findWay(points, fromxy, toxy) {
    //very unoptimized, im too lazy to connect ngraph.path right now. easier to write it again!
    let fromPoint = points.find(p => p.x === fromxy.x && p.y === fromxy.y);
    if (!fromPoint) throw new Error("no point at " + fromxy.x + "," + fromxy.y);
    let toPoint = points.find(p => p.x === toxy.x && p.y === toxy.y);
    if (!toPoint) throw new Error("no point at " + toxy.x + "," + toxy.y);
    let ways = [[fromPoint]];
    let checked = new Set([fromPoint.id]);
    while (ways.length) {

        let newWays = [];
        for (let way of ways.slice()) {
            let lastPoint = way[way.length-1];
            if (lastPoint.id === toPoint.id) {
                return way;
            }
            for (let nextway of lastPoint.waysfromhere) {
                if (!checked.has(nextway.to.id)) {
                    newWays.push([...way, nextway.to]);
                    checked.add(nextway.to.id);
                }
            }
        }
        ways = newWays;
    }
    return [];
}


function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
// scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(2, 2);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

function create() {
    game.gamestate = state;
    state.map = game.add.tilemap('level1');
    state.map.addTilesetImage('rtp');
    state.platformsLayer = state.map.createLayer('platforms');
    state.groundLayer = state.map.createLayer('ground');
    state.map.setLayer(state.platformsLayer);
    state.platformsLayer.resizeWorld();

    state.selected = null;
    state.mousedown = null;
    state.selectionRect = null;

    //makeSharped();

    state.groups = {
       buildings: game.add.group(),
       units: game.add.group(),
       projectiles: game.add.group()
    };

    for (let {name, type, x, y, properties} of state.map.objects['units']) {
        switch (type) {
            case "Town":
                y -= 16;
                state.groups.buildings.add(new Town(x,y,properties));
                break;
            case "Worker":
                y -= 16;
                state.groups.units.add(new Worker(x,y,properties));
                break;
            case "Sworcher":
                y -= 16;
                state.groups.units.add(new Swordsman(x,y,properties));
                break;
            default:
                console.log(type,x,y, properties && properties.side);

        }
    }

    state.waypoints = waypointsSimple(state.map);

    game.input.onDown.add(onClick);
}

function onClick(e) {
    console.log('click', e);
}

function update() {
    let pos = game.input.position;
    let tilex = Math.floor(pos.x / 16), tiley = Math.floor(pos.y / 16);
    let tileAt = state.map.getTile(tilex, tiley+1);
    if (tileAt && tileAt.index !== -1 && state.selected) {
        let from = {
            x: (state.selected.x/16)|0,
            y: ((state.selected.y/16)|0) + 1
        };
        state.debugway = findWay(state.waypoints, from, {x:tilex, y:tiley+1} );
    } else {
        state.debugway = [];
    }

    if (!state.mousedown && game.input.activePointer.isDown) {
        state.mousedown = {x:pos.x, y:pos.y};
    }
    if (state.mousedown) {
        if (game.input.activePointer.isDown) {
            state.selectionRect = new Phaser.Rectangle(state.mousedown.x, state.mousedown.y, pos.x - state.mousedown.x, pos.y - state.mousedown.y)
           // console.log(state.selectionRect.x, state.selectionRect.y)
        } else {
            state.selectionRect = null;
            state.mousedown = null;
        }
    }

}

function debugRender1() {
    game.debug.text(game.input.position, 16, 16);
    if (state.debugway && state.debugway.length) {
        state.debugway.forEach(w => game.debug.geom(new Phaser.Circle(w.x*16,w.y*16,4), "red"))
    }
    if (state.selectionRect) game.debug.geom(state.selectionRect, "rgba(255,0,0,0.2)")
}
function preload() {
    game.time.advancedTiming = true;
}


let bitmap, sprite;
function create() {
    bitmap = game.add.bitmapData(1024, 1024);

    bitmap.fill(55,55,55);

    sprite = game.add.sprite(0,0,bitmap);

    bitmap.update(0, 0, 1024, 1024);

}
let pix = 0;

function update() {
    bitmap.setPixel((pix%1024), (pix/1024)|0, 255,0,0);
    pix++;
}

function debugRender1() {
    game.debug.text(game.time.fps, game.camera.width/2,game.camera.height-10);
}
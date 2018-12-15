const Bitmaps = new Map();

export default function getBitmap(color, radius = 0) {
    let bitmap = Bitmaps.get(color + '_' + radius);
    if (!bitmap) {
        if (radius === 0) {
            bitmap = game.add.bitmapData(1, 1);
            bitmap.rect(0, 0, 1, 1, color);
        } else {
            bitmap = game.add.bitmapData(radius*2+2, radius*2+2);
            bitmap.circle(radius+1, radius+1, radius, color);
        }
        Bitmaps.set(color + '_' + radius, bitmap);
    }
    return bitmap;
}

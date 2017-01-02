
export default class ThreeExport {

    saveTexture(colorModel) {
        let canvas = document.createElement('canvas');
        let colors = colorModel.normalizedColors;
        canvas.setAttribute("width", colors.length);
        canvas.setAttribute('height', 1);
        let ctx = canvas.getContext('2d');
        let im = ctx.getImageData(0, 0, colors.length, 1);
        for (let ci = 0; ci < colors.length; ci++) {
            im.data[ci * 4 + 0] = colors[ci] >> 16;
            im.data[ci * 4 + 1] = (colors[ci] >> 8) & 0xff;
            im.data[ci * 4 + 2] = (colors[ci]) & 0xff;
            im.data[ci * 4 + 3] = 0xff;
        }
        ctx.putImageData(im, 0, 0);
        return new THREE.CanvasTexture(canvas,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter
        )
    }

    saveGeometry(verticesModel) {

        let g = new THREE.BufferGeometry();
        g.addAttribute("position", new THREE.BufferAttribute( new Float32Array( verticesModel.vertices), 3));
        g.addAttribute("normal", new THREE.BufferAttribute( new Float32Array( verticesModel.normals), 3));
        //g.addAttribute("color", new THREE.BufferAttribute( new Float32Array( colors), 3));
        g.addAttribute("uv", new THREE.BufferAttribute( new Float32Array( verticesModel.uvs), 2));
        return g;

    }
    
}
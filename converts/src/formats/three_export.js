
export default class ThreeExport {

    saveTexture(colorModel) {
        let canvas, ctx;
        let im = colorModel.fillTexture((width, height) => {
            canvas = document.createElement('canvas');
            canvas.setAttribute("width", width);
            canvas.setAttribute('height', height);
            ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, width, height);
        });
        if (!ctx) {
            canvas = document.createElement('canvas');
            canvas.setAttribute("width", im.width);
            canvas.setAttribute('height', im.height);
            ctx = canvas.getContext('2d');
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
function inject(shader, lineNr, line) {
    var lines = shader.split(/[\r\n]/);
    lines.splice(lineNr >= 0 ? lineNr : lines.length + lineNr, 0, line);
    return lines.join("\n");
}

function createRotatedMaterialFrom(src, size) {
    if (size === undefined) size = 160;
    
    let shaderKey = "phong";
    if (src instanceof THREE.MeshLambertMaterial) {
        shaderKey = "lambert";
    }
    
    var material = new THREE.ShaderMaterial({
        lights: true,
        uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib[shaderKey].uniforms),
        vertexShader:
        //attribute vec3 position
        //do not see where is something like resolution.
            inject(THREE.ShaderLib[shaderKey].vertexShader, -2,
                //""
                "vec4 oldPos = gl_Position; gl_Position.z = gl_Position.y; gl_Position.y += -position.y/" + size + ". + position.z/" + size + ".;"
                //"gl_Position.x = gl_Position.x*cos(3.14/4.);gl_Position.y = gl_Position.y*sin(3.14/4.);"
            ),
        fragmentShader: THREE.ShaderLib[shaderKey].fragmentShader
    });

    material.map = src.map;
    //todo: copy other props from Phong, check it is exactly phong
    material.uniforms.map.value = material.map;
    material.needsUpdate = true;

    return material;
}
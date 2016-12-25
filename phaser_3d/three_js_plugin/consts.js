export default {
    AmbientLight: {factory: ({color, intensity}) => new THREE.AmbientLight(color, intensity), helperClass: undefined, shadows: false, target: false},
    DirectionalLight: {factory: ({color, intensity}) => new THREE.DirectionalLight(color, intensity), helperClass: THREE.DirectionalLightHelper, shadows: true, target: true},
    SpotLight: {factory: ({color, intensity, distance, angle, penumbra, decay}) => new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay), helperClass: THREE.SpotLightHelper, shadows: true, target: true},
    PointLight: {factory: ({color, intensity, distance, decay}) => new THREE.PointLight(color, intensity, distance, decay), helperClass: THREE.PointLightHelper, shadows: true, target: false},
    
    RenderSprites: 1,
    RenderModels: 2,
    RenderNothing: 3,
    
    ShadowMaterial: new THREE.ShadowMaterial()
};
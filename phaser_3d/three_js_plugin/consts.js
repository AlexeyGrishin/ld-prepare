export default {
    AmbientLight: {
        factory: ({color, intensity}) => new THREE.AmbientLight(color, intensity),
        helperClass: undefined,
        shadows: false,
        target: false
    },
    DirectionalLight: {
        factory: ({color, intensity, distance = 100}) => {
            let light = new THREE.DirectionalLight(color, intensity);
            light.shadow.camera.top = distance;
            light.shadow.camera.bottom = -distance/2;
            light.shadow.camera.left = -distance/2;
            light.shadow.camera.right = distance/2;
            light.shadow.camera.near = 0;
            light.shadow.camera.far = distance;
            light.shadow.camera.updateProjectionMatrix();
            return light;
        },
        helperClass: THREE.DirectionalLightHelper,
        shadows: true,
        target: true
    },
    SpotLight: {
        factory: ({color, intensity, distance, angle, penumbra, decay}) => new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay),
        helperClass: THREE.SpotLightHelper,
        shadows: true,
        target: true
    },
    PointLight: {
        factory: ({color, intensity, distance, decay}) => new THREE.PointLight(color, intensity, distance, decay),
        helperClass: THREE.PointLightHelper,
        shadows: true,
        target: false
    },
    
    RenderSprites: 1,
    RenderModels: 2,
    RenderNothing: 3,
    
    ShadowMaterial: new THREE.ShadowMaterial()
};
console.log(voxels.length);
var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera( 0, 640, 640, 0, 1, 100 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( 640, 640 );
renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//renderer.gammaInput = true;
//renderer.gammaOutput = true;
document.body.appendChild( renderer.domElement );

var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
material.transparent = true;
material.opacity = 0;
var tmpGeometry = new THREE.Geometry();
function addGeometry(x, y, z) {
    var geometry = new THREE.BoxGeometry(1,1,1);// new THREE.BoxGeometry( 1/640, 1/640, 1/640 );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(x, 640-y, z);
    //scene.add(cube);
    cube.receiveShadow = true;
    cube.castShadow = true;
    cube.updateMatrix();
    tmpGeometry.merge(geometry, cube.matrix);
}



var mshFloor = new THREE.Mesh( new THREE.PlaneGeometry( 640, 640, 1, 1 ), new THREE.MeshLambertMaterial({color: 0xcccccc}) );
mshFloor.receiveShadow = true;
mshFloor.position.set( 320, 320, 0 );
scene.add(mshFloor);

var ambientLight = new THREE.AmbientLight(0xffffff, 1 );
scene.add( ambientLight );

var light = new THREE.PointLight( 0xffffff, 1, 300, 0);
//light.add( new THREE.Mesh( new THREE.SphereGeometry( 10), new THREE.MeshLambertMaterial( { color: 0xff0040 } ) ) );

//light.shadow.darkness = 0.5;
//light.shadowDarkness = 0.5;
light.position.set( 120,640-30,40 );
//light.target.position.set( 320,320,100);
light.castShadow = true;
//scene.add(light.target);
//scene.add( light );

var fire = new THREE.PointLight( 0xffffff, 1, 600, 0);
fire.castShadow = true;
fire.position.set(29*16-20, 640-18*16, 55);
scene.add(fire);
//light.angle = Math.PI*2-1;

//scene.add(new THREE.SpotLightHelper(light) );

//voxels.forEach(function(p) { addGeometry(p[0], p[1], p[2])});

var loader = new THREE.OBJLoader();

// load a resource
loader.load(
    // resource URL
    'roguelike-0.obj',
    // Function when resource is loaded
    function ( object ) {

        object.rotateX(90);

        for (var x = 0; x < 320; x+= 32) {
            for (var y = 0; y < 640; y += 32) {
                var no = object.clone();
                no.position.set(x,y,0);
                no.updateMatrix();
                //console.log(object);
                no.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        //console.log(child.material);
                        child.material = material;
                        child.receiveShadow = true;
                        child.castShadow = true;

                    }

                } );
                scene.add( no );
            }
        }


    }
);

loader.load(
    "roguelike-3.obj",
    function (object) {
        object.rotateX(90);

        for (var x = 400; x < 500; x += 16 ) {
            var no = object.clone();
            no.position.set(x, 540, 0);
            no.updateMatrix();
            no.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    //console.log(child.material);
                    child.material = material;
                    child.receiveShadow = true;
                    child.castShadow = true;

                }

            } );
            scene.add( no );
        }
    }
);
loader.load(
    "roguelike-4.obj",
    function (object) {
        object.rotateX(90);

        for (var y = 100; y < 200; y += 16 ) {
            var no = object.clone();
            no.position.set(400-16, 640-y, 0);
            no.updateMatrix();
            no.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    //console.log(child.material);
                    child.material = material;
                    child.receiveShadow = true;
                    child.castShadow = true;

                }

            } );
            scene.add( no );
        }
    }
);

function load(name, locate) {
    loader.load(
        name,
        function (object) {
            object.rotateX(90);
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    //console.log(child.material);
                    child.material = material;
                    child.receiveShadow = true;
                    child.castShadow = true;

                }

            } );

            locate(object);
        }
    );
}

load("roguelike-14.obj", function(object) {

    var no = object.clone();
    no.position.set(430, 640-150, 0);
    scene.add(no);
});

load("roguelike-15.obj", function(object) {

    var no = object.clone();
    no.position.set(430+16, 640-150, 0);
    scene.add(no);
});


var mainMesh = new THREE.Mesh(tmpGeometry, material);
mainMesh.receiveShadow = true;
mainMesh.castShadow = true;
scene.add(mainMesh);

camera.position.z = 100;
camera.position.x = 0;
camera.position.y = 0;

var lastCalledTime;
var fps;

function render() {
    requestAnimationFrame( render );

    //fire.position.set(29*16 + 2*Math.random(), 640-10*16 + 2*Math.random(), 15 + 2*Math.random());

    renderer.render( scene, camera );
    if(!lastCalledTime) {
        lastCalledTime = Date.now();
        fps = 0;
        return;
    }
    delta = (Date.now() - lastCalledTime)/1000;
    lastCalledTime = Date.now();
    fps = 1/delta;
    document.getElementById('fps').innerHTML = fps;
}
render();
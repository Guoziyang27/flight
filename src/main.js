import Shader from './Shader';
import Env from "./env";
import {vec3, mat4, glMatrix, vec4} from './glMatrix'
import loadOBJ, {parseMTL} from "./loadOBJ";
import {parseOBJ} from "./loadOBJ";

import rawOBJ from './AircraftModel/3d-model1.obj'
import rawMTl from './AircraftModel/3d-model1.mtl'
import rawTerrain from './Terrain/plain.obj'
import terrainImg from './Terrain/green.png'
import upURL from './Skybox/up.png'
import dnURL from './Skybox/dn.png'
import rtURL from './Skybox/rt.png'
import lfURL from './Skybox/lf.png'
import bkURL from './Skybox/bk.png'
import ftURL from './Skybox/ft.png'

let canvas;

function genOBJBuffer(gl, data, material) {
    const objs = []

    // console.log(data);

    let t = -Number.MAX_VALUE;
    for (let i = 0; i < data.geometries.length; ++i) {
        for (let j = 0; j < data.geometries[i].data.position.length; ++j) {
            t = Math.max(t, data.geometries[i].data.position[j]);
        }
    }
    let minX = Number.MAX_VALUE, maxX = -Number.MAX_VALUE,
        minY = Number.MAX_VALUE, maxY = -Number.MAX_VALUE,
        minZ = Number.MAX_VALUE, maxZ = -Number.MAX_VALUE;
    for (let i = 0; i < data.geometries.length; ++i) {
        for (let j = 0; j < data.geometries[i].data.position.length; j += 3) {
            minX = Math.min(minX, data.geometries[i].data.position[j]);
            maxX = Math.max(maxX, data.geometries[i].data.position[j]);
            minY = Math.min(minY, data.geometries[i].data.position[j + 1]);
            maxY = Math.max(maxY, data.geometries[i].data.position[j + 1]);
            minZ = Math.min(minZ, data.geometries[i].data.position[j + 2]);
            maxZ = Math.max(maxZ, data.geometries[i].data.position[j + 2]);
        }
    }

    const OBB = [
        vec3.fromValues(maxX / t * 5, maxY / t * 5, maxZ / t * 5),
        vec3.fromValues(minX / t * 5, maxY / t * 5, maxZ / t * 5),
        vec3.fromValues(maxX / t * 5, minY / t * 5, maxZ / t * 5),
        vec3.fromValues(minX / t * 5, minY / t * 5, maxZ / t * 5),
        vec3.fromValues(maxX / t * 5, maxY / t * 5, minZ / t * 5),
        vec3.fromValues(minX / t * 5, maxY / t * 5, minZ / t * 5),
        vec3.fromValues(maxX / t * 5, minY / t * 5, minZ / t * 5),
        vec3.fromValues(minX / t * 5, minY / t * 5, minZ / t * 5),
    ]


    // const t = Math.max(...data.geometries.map((obj) => Math.max(...obj.data.position)));

    data.geometries.forEach((obj, index) => {
        const vertices = [];
        const len = obj.data.position.length / 3;
        const position = obj.data.position;
        const texcoord = obj.data.texcoord;
        const normal = obj.data.normal;
        const color = new Float32Array(material[obj.material].diffuse);
        for (let i = 0; i < len; ++i) {
            vertices.push(position[i * 3] / t * 5);
            vertices.push(position[i * 3 + 1] / t * 5);
            vertices.push(position[i * 3 + 2] / t * 5);

            vertices.push(normal[i * 3]);
            vertices.push(normal[i * 3 + 1]);
            vertices.push(normal[i * 3 + 2]);

            vertices.push(color[0]);
            vertices.push(color[1]);
            vertices.push(color[2]);
        }

        const VAO = gl.createVertexArray();
        const VBO = gl.createBuffer();

        gl.bindVertexArray(VAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // position attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 9 * 4, 0);
        gl.enableVertexAttribArray(0);

        // color attribute
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 9 * 4, (3 * 4));
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 9 * 4, (6 * 4));
        gl.enableVertexAttribArray(2);

        objs.push({
            VBO: VBO,
            VAO: VAO,
            num: len,
            ambient: material[obj.material].ambient,
            specular: material[obj.material].specular
        })
    })
    return [objs, OBB];
}

async function getOBJFromPath(objHref) {

    console.log(objHref);
    const response = await fetch(objHref);
    const text = await response.text();
    // console.log(text);
    const aircraftObj = parseOBJ(text);
    console.log(aircraftObj);

    const response1 = await fetch(rawMTl);
    const matTexts = await response1.text();
    // console.log(matTexts);
    const materials = parseMTL(matTexts);
    console.log(materials);
    return [aircraftObj, materials];
}

function genTerrainBuffer(gl, data) {
    const objs = []
    //console.log(data);
    let t = -Number.MAX_VALUE;
    // for (let i = 0; i < data.geometries.length; ++i) {
    //     for (let j = 0; j < data.geometries[i].data.position.length; ++j) {
    //         t = Math.max(t, data.geometries[i].data.position[j]);
    //     }
    // }

    let x_max = -Number.MAX_VALUE;
    for (let j = 0; j < data.geometries[0].data.position.length; j+=3) {
        x_max = Math.max(t, data.geometries[0].data.position[j]);
    }

    let y_max = -Number.MAX_VALUE;
    for (let j = 1; j < data.geometries[0].data.position.length; j+=3) {
        y_max = Math.max(t, data.geometries[0].data.position[j]);
    }

    let z_max = -Number.MAX_VALUE;
    for (let j = 2; j < data.geometries[0].data.position.length; j+=3) {
        z_max = Math.max(t, data.geometries[0].data.position[j]);
    }

    t = Math.max(x_max, y_max, z_max);

    const scaleFactor = 1000;

    const heights = [];
    for (let i = 0 ; i <= x_max; ++i) {
        heights.push([]);
        for (let j = 0; j <= z_max; ++j) {
            heights[i].push(0);
        }
    }
    console.log(heights.length);
    for (let i = 0 ; i < data.geometries[0].data.position.length; i += 3) {
        const x = data.geometries[0].data.position[i]
        const z = data.geometries[0].data.position[i + 2]
        heights[x][z] = data.geometries[0].data.position[i + 1];
    }
    const getHeight = ([x, y, z]) => {
        return heights[Math.floor((x) / scaleFactor * t % x_max)][Math.floor((z) / scaleFactor * t % z_max)] / t * scaleFactor - scaleFactor / 20;
    }

    data.geometries.forEach((obj, index) => {
        const vertices = [];
        const len = obj.data.position.length / 3;
        const position = obj.data.position;
        const texcoord = obj.data.texcoord;
        const normal = obj.data.normal;
        //const color = new Float32Array(material[obj.material].diffuse);
        const scaleFactor = 1000;

        for (let i = 0; i < len; ++i) {
             vertices.push(position[i * 3] / t * scaleFactor);
             vertices.push(position[i * 3 + 1] / t * scaleFactor - scaleFactor/20);
             vertices.push(position[i * 3 + 2] / t * scaleFactor);


            vertices.push(normal[i * 3]);
            vertices.push(normal[i * 3 + 1]);
            vertices.push(normal[i * 3 + 2]);

            vertices.push(1);
            vertices.push(1);
            vertices.push(1);

            vertices.push(texcoord[i * 2]);
            vertices.push(texcoord[i * 2 + 1]);
        }

        const VAO = gl.createVertexArray();
        const VBO = gl.createBuffer();

        gl.bindVertexArray(VAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // position attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 11 * 4, 0);
        gl.enableVertexAttribArray(0);

        // normal attribute
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 11 * 4, (3 * 4));
        gl.enableVertexAttribArray(1);

        // color attribute
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 11 * 4, (6 * 4));
        gl.enableVertexAttribArray(2);

        //texture attribute
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 11 * 4, (9 * 4));
        gl.enableVertexAttribArray(3);

        const x_h = x_max/ t * scaleFactor;
        const y_h = y_max/ t * scaleFactor - scaleFactor/5;
        const z_h = z_max/ t * scaleFactor;
        const x_l = 0;
        const y_l = - scaleFactor/5;
        const z_l = 0;
        objs.push({VBO: VBO, VAO: VAO, num: len,},
            {border_x_l: x_l, border_x_h: x_h, border_y_l: y_l, border_y_h:y_h, border_z_l: z_l, border_z_h: z_h,size_x : x_max/ t * scaleFactor,size_z : z_max/ t * scaleFactor });
        console.log(objs[1]);
    })
    return [objs, getHeight];
}

async function getTerrainFromPath(terrainHref) {

    console.log(terrainHref);
    const response = await fetch(terrainHref);
    const text = await response.text();
    // console.log(text);
    const terrainOBJ = parseOBJ(text);
    console.log(terrainOBJ);
    return terrainOBJ;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(pixel));
    return texture;
}

function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}

function genSkyBoxBuffer(gl) {

    const skyVAO = gl.createVertexArray();
    const skyVBO = gl.createBuffer();

    gl.bindVertexArray(skyVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyVBO);
    const skyboxVertices = new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    return [skyVBO, skyVAO];

}

function getVisionRange(near, far, fov, aspect) {
    // far = 2 * far;
    // fov = 2 * fov;
    // aspect = 2 * aspect;
    const near_dist_vec = vec3.create();
    const near_middle = vec3.create();
    const far_dist_vec = vec3.create();
    const far_middle = vec3.create();
    const vision_up_vec = vec3.create();
    const vision_rt_vec = vec3.create();
    const near_up_vec = vec3.create();
    const near_dn_vec = vec3.create();
    const near_rt_vec = vec3.create();
    const near_lf_vec = vec3.create();
    const near_pt1 = vec3.create();
    const near_pt2 = vec3.create();
    const near_pt3 = vec3.create();
    const near_pt4 = vec3.create();
    const far_up_vec = vec3.create();
    const far_dn_vec = vec3.create();
    const far_rt_vec = vec3.create();
    const far_lf_vec = vec3.create();
    const far_pt1 = vec3.create();
    const far_pt2 = vec3.create();
    const far_pt3 = vec3.create();
    const far_pt4 = vec3.create();
    vec3.scale(near_dist_vec, Env.cameraFront, near);
    vec3.scale(far_dist_vec, Env.cameraFront, far);
    //求出截面中点
    vec3.add(near_middle, Env.cameraPos, near_dist_vec);
    vec3.add(far_middle, Env.cameraPos, far_dist_vec);
    //两个方向
    vec3.cross(vision_rt_vec, Env.cameraUp, Env.cameraFront);
    vec3.cross(vision_up_vec, vision_rt_vec, Env.cameraFront);
    //正则化
    vec3.normalize(vision_up_vec, vision_up_vec);
    vec3.normalize(vision_rt_vec, vision_rt_vec);
    // console.log(vision_up_vec);
    // console.log(vision_rt_vec);
    //计算
    vec3.scale(far_up_vec, vision_up_vec, Math.tan(fov/2) * far);
    vec3.scale(far_dn_vec, far_up_vec, -1);
    vec3.scale(far_rt_vec, vision_rt_vec, aspect * Math.tan(fov/2) * far);
    vec3.scale(far_lf_vec, far_rt_vec, -1);

    vec3.add(far_pt1, far_up_vec, far_middle);
    vec3.add(far_pt1, far_rt_vec, far_pt1);

    vec3.add(far_pt2, far_dn_vec, far_middle);
    vec3.add(far_pt2, far_lf_vec, far_pt2);

    vec3.add(far_pt3, far_dn_vec, far_middle);
    vec3.add(far_pt3, far_rt_vec, far_pt3);

    vec3.add(far_pt4, far_up_vec, far_middle);
    vec3.add(far_pt4, far_lf_vec, far_pt4);

    vec3.scale(near_up_vec, vision_up_vec, Math.tan(glMatrix.toRadian(22.5)) * near / 2);
    vec3.scale(near_dn_vec, near_up_vec, -1);
    vec3.scale(near_rt_vec, vision_rt_vec, aspect * Math.tan(glMatrix.toRadian(22.5)) * near / 2);
    vec3.scale(near_lf_vec, near_rt_vec, -1);

    vec3.add(near_pt1, near_up_vec, near_middle);
    vec3.add(near_pt1, near_rt_vec, near_pt1);

    vec3.add(near_pt2, near_dn_vec, near_middle);
    vec3.add(near_pt2, near_lf_vec, near_pt2);

    vec3.add(near_pt3, near_dn_vec, near_middle);
    vec3.add(near_pt3, near_rt_vec, near_pt3);

    vec3.add(near_pt4, near_up_vec, near_middle);
    vec3.add(near_pt4, near_lf_vec, near_pt4);
    
    const pt_s = [];
    pt_s.push(far_pt1);
    pt_s.push(far_pt2);
    pt_s.push(far_pt3);
    pt_s.push(far_pt4);
    pt_s.push(near_pt1);
    pt_s.push(near_pt2);
    pt_s.push(near_pt3);
    pt_s.push(near_pt4);
    let z_max = -Number.MAX_VALUE;
    let y_max = -Number.MAX_VALUE;
    let x_max = -Number.MAX_VALUE;
    let z_min = Number.MAX_VALUE;
    let y_min = Number.MAX_VALUE;
    let x_min = Number.MAX_VALUE;
    for (let i = 0; i < pt_s.length; ++i) {
        x_max = Math.max(x_max, pt_s[i][0]);
        y_max = Math.max(y_max, pt_s[i][1]);
        z_max = Math.max(z_max, pt_s[i][2]);

        x_min = Math.min(x_min, pt_s[i][0]);
        y_min = Math.min(y_min, pt_s[i][1]);
        z_min = Math.min(z_min, pt_s[i][2]);
    }
    return {
        x_range: {min: x_min, max: x_max},
        y_range: {min: y_min, max: y_max},
        z_range: {min: z_min, max: z_max},
    }
}

function visionToworld(visionRange, view_inverse) {
    const visionMin_world = vec4.create();
    vec4.transformMat4(visionMin_world,
        vec4.fromValues(visionRange.x_range.min,visionRange.y_range.min,visionRange.z_range.min,1.0),
        view_inverse);
    const visionMax_world = vec4.create();
    vec4.transformMat4(visionMax_world,
        vec4.fromValues(visionRange.x_range.max,visionRange.y_range.max,visionRange.z_range.max,1.0),
        view_inverse);
    return {
        x_range: {min: visionMin_world[0], max: visionMax_world[0]},
        y_range: {min: visionMin_world[1], max: visionMax_world[1]},
        z_range: {min: visionMin_world[2], max: visionMax_world[2]},
    };
}

export default async function main() {
    console.log("begin main")

    canvas = document.querySelector('#glcanvas');
    const div = document.getElementById('canvas-div');

    div.addEventListener('mousemove', Env.mouse_callback);
    div.addEventListener('keydown', Env.keydown_callback);
    div.addEventListener('keyup', Env.keyup_callback);
    div.onmousedown = Env.mousedown_callback;
    div.onmouseup = Env.mouseup_callback;

    console.log(canvas.width, canvas.height);
    Env.SCR_WIDTH = canvas.width;
    Env.SCR_HEIGHT = canvas.height;
    const gl = canvas.getContext('webgl2');
    gl.enable(gl.DEPTH_TEST)

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const ourShader = new Shader(gl, "vsShader", 'fsShader');
    const skyShader = new Shader(gl, "skyVsShader", 'skyFsShader');
    const terrainShader = new Shader(gl, "terrainVsShader", 'terrainFsShader');

    const objHref = rawOBJ;
    const [aircraftOBJ, materials] = await getOBJFromPath(objHref);
    const [aircraftOBJs, aircraftOBB] = genOBJBuffer(gl, aircraftOBJ, materials);

    //terrain part begin
    const terrainHref = rawTerrain;
    const terrainOBJ = await getTerrainFromPath(terrainHref);
    const [terrainOBJs, terrainGetHeight] = genTerrainBuffer(gl, terrainOBJ);
    const terrainTexture = createTexture(gl, terrainImg);
    console.log("x_max");
    console.log(terrainOBJs[1].border_x_h);
    console.log("z_max");
    console.log(terrainOBJs[1].border_z_h);
    //terrain part end
    //Skybox Part Begins
    const [skyVBO, skyVAO] = genSkyBoxBuffer(gl);
    const skyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
    const skyFaceInfos = [
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: rtURL,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: lfURL,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: upURL,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: dnURL,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: bkURL,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: ftURL,
        },
    ];
    skyFaceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;

        // Upload the canvas to the cubemap face.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 512;
        const height = 512;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        // setup each face so it's immediately renderable
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            const width = image.width;
            const height = image.height;
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyTexture);
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    skyShader.setInt("skybox", 0);

    //SkyBox Part Ends


    function render() {

        const d = new Date();
        let currentFrame = d.getTime();
        Env.deltaTime = currentFrame - Env.lastFrame < 1000 ? currentFrame - Env.lastFrame : 10;
        Env.lastFrame = currentFrame;

        Env.processInput();

        gl.enable(gl.DEPTH_TEST)
        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // activate shader



//region

        const projection = mat4.create();
        const fov = glMatrix.toRadian(Env.fov);
        const near = 0.1;
        const far = 5000;
        const aspect = Env.SCR_WIDTH / Env.SCR_HEIGHT;
        mat4.perspective(projection, fov, aspect, near, far);
        const view = mat4.create();
        let t = vec3.create();
        vec3.add(t, Env.cameraPos, Env.cameraFront);
        mat4.lookAt(view, Env.cameraPos, t, Env.cameraUp);
        //Calculate Vision range
        //这个是相机坐标系
        // const visionRange = getVisionRange(near, far, fov, aspect)
        //Draw Skybox
        skyShader.use();
        const view_tmp = mat4.create();
        const view_inverse = mat4.create();
        mat4.invert(view_inverse, view);
        mat4.copy(view_tmp, view);
        view_tmp[12] = 0;
        view_tmp[13] = 0;
        view_tmp[14] = 0;
        const viewDirectionProjectionMat = mat4.create();
        mat4.multiply(viewDirectionProjectionMat, projection, view_tmp);
        const viewDirectionProjectionInvMat = mat4.create();
        mat4.invert(viewDirectionProjectionInvMat,viewDirectionProjectionMat);

        skyShader.setMat4('u_viewDirectionProjectionInverse',viewDirectionProjectionInvMat);
        skyShader.setInt('u_skybox',0);
        gl.depthFunc(gl.LEQUAL);
        gl.bindVertexArray(skyVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        //Skybox ends
        ourShader.use();
        ourShader.setMat4("projection", projection);
        ourShader.setMat4("view", view);
        ourShader.setVec3("eyePosition", Env.cameraPos);
        ourShader.setVec3("lightPosition", vec3.fromValues(0.0, 0.0, 0.0));
        ourShader.setFloat("roughness", 0.8);
        ourShader.setFloat("fresnel", 5);
        ourShader.setInt("useLightPoint", 1);
        ourShader.setInt("useSpecular", 0);

        const modelOBJ = mat4.create();
        mat4.translate(modelOBJ, modelOBJ, vec3.fromValues(0, -1, 0));

        const x = Env.aircraftStatus.x;
        const y = Env.aircraftStatus.y;
        const z = Env.aircraftStatus.z;
        const modelRotation = mat4.fromValues(x[0], x[1], x[2], 0,
            y[0], y[1], y[2], 0,
            z[0], z[1], z[2], 0,
            0, 0, 0, 1);
        mat4.multiply(modelOBJ, modelRotation, modelOBJ);
        const aircraftOBBRotated = aircraftOBB.map((v) => {
            const res = vec4.create();
            vec4.transformMat4(res, vec4.fromValues(v[0], v[1], v[2], 1), modelOBJ);
            return vec3.fromValues(res[0], res[1], res[2]);
        })


        if (Env.isCrash) {
            console.log("Crashed!!!");
        }
        aircraftOBJs.forEach((obj, index) => {
            ourShader.setVec3("lightPosition", vec3.fromValues(1, 1, 1));
            ourShader.setInt("useLightPoint", 0);
            ourShader.setInt("useTexture", 0);
            ourShader.setVec3("ambient", vec3.fromValues(obj.ambient[0], obj.ambient[1], obj.ambient[2]));
            ourShader.setInt("useSpecular", 1);
            ourShader.setVec3("specular", vec3.fromValues(obj.specular[0], obj.specular[1], obj.specular[2]));

            if (index == 7) {
                let fanCenter = vec3.fromValues(0, 0, 1)
                const modelOBJTmp = mat4.create();
                mat4.translate(modelOBJTmp, modelOBJ, vec3.fromValues(0, 1, 0))
                mat4.rotateZ(modelOBJTmp, modelOBJTmp, Math.cos(currentFrame * 0.1))
                mat4.translate(modelOBJTmp, modelOBJTmp, vec3.fromValues(0, -1, 0))
                ourShader.setMat4("model", modelOBJTmp);
                gl.bindVertexArray(obj.VAO);
                gl.drawArrays(gl.TRIANGLES, 0, obj.num);
            } else {
                ourShader.setMat4("model", modelOBJ);
                gl.bindVertexArray(obj.VAO);
                gl.drawArrays(gl.TRIANGLES, 0, obj.num);
            }
        })
        
        terrainShader.use();
        terrainShader.setMat4("projection", projection);
        terrainShader.setMat4("view", view);
        terrainShader.setVec3("eyePosition", Env.cameraPos);
        terrainShader.setVec3("lightPosition", vec3.fromValues(1, 1, 1));
        terrainShader.setFloat("roughness", 0.8);
        terrainShader.setFloat("fresnel", 5);
        terrainShader.setInt("useLightPoint", 0);
        terrainShader.setVec3("ambient", vec3.fromValues(1, 1, 1));
        terrainShader.setInt("ourTexture", 0);
        terrainShader.setInt("useTexture", 1);
        const borders = terrainOBJs[1];
        const TransedMat = mat4.create();
        const x_block_offset = Math.floor(Env.aircraftStatus.location[0]/borders.size_x);
        const tmpMat = mat4.create();
        const z_block_offset = Math.floor(Env.aircraftStatus.location[2]/borders.size_z);
        const x_flag = (2 + x_block_offset)%2;
        const z_flag = (2 + z_block_offset)%2;
        const lr_map=[1,0,3,2];
        const fb_map=[2,3,0,1];
        const cross_map = [3,2,1,0];
        const center_id = 2*z_flag+x_flag;
        const lr_id = lr_map[center_id];
        const fb_id = fb_map[center_id];
        const cross_id = cross_map[center_id];


        for (let i = 0; i < aircraftOBBRotated.length; ++i) {
            let point = aircraftOBBRotated[i];
            const xt = Math.abs(point[0] + Env.aircraftStatus.location[0] - x_block_offset * terrainOBJs[1].size_x);
            const zt = Math.abs(point[2] + Env.aircraftStatus.location[2] - z_block_offset * terrainOBJs[1].size_z);
            const height = terrainGetHeight([x_flag ? Math.abs(terrainOBJs[1].size_x - xt) : xt,
                Math.abs(point[1] + Env.aircraftStatus.location[1]),
                z_flag ? Math.abs(terrainOBJs[1].size_z - zt) : zt]);
            if (height > point[1] + Env.aircraftStatus.location[1]) {
                Env.isCrash = true;
            }
        }

        terrainShader.setFloat("x_size",borders.size_x);
        terrainShader.setFloat("z_size",borders.size_z);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
        (-Env.aircraftStatus.location[0] + x_block_offset * borders.size_x,
            -Env.aircraftStatus.location[1],
            -Env.aircraftStatus.location[2] + z_block_offset * borders.size_z)
        );

        terrainShader.setMat4("model", TransedMat);
        gl.bindVertexArray(terrainOBJs[0].VAO);
        gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
        terrainShader.setInt("id",center_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (borders.size_x, 0, 0)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",lr_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (0, 0, borders.size_z)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",cross_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (- borders.size_x, 0, 0)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",fb_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (- borders.size_x, 0, 0)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",cross_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (0, 0, - borders.size_z)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",lr_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (0, 0, - borders.size_z)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",cross_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (borders.size_x, 0, 0)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",fb_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);

        mat4.translate(TransedMat, TransedMat, vec3.fromValues
            (borders.size_x, 0, 0)
        );
        terrainShader.setMat4("model", TransedMat);
        terrainShader.setInt("id",cross_id);
        gl.drawArrays(gl.TRIANGLES, 0, terrainOBJs[0].num);





        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

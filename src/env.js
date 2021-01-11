import { vec3, vec4, mat4, glMatrix } from './glMatrix'
import {exp} from "./glMatrix/quat";

class control {
    static W = false;
    static A = false;
    static S = false;
    static D = false;
    static Q = false;
    static E = false;
    static X = false;
    static F = false;
    static Space = false;
    static leftButton = false;
}

class bullet {
    constructor() {
        this.location = vec4.fromValues(0,0,0,1)
        this.velocity = 0.05
        this.direction = vec3.clone(Env.aircraftStatus.z)
        this.lifeSpan = 100000
    }
}

export default class Env {

    static PI = 3.141592653589793

    static gl;

    static uploadedOBJ = false;
    static aircraftOBJs;
    static aircraftOBB;


    static SCR_WIDTH = 800;
    static SCR_HEIGHT = 600;

// camera
    static cameraPos   = vec3.fromValues(0.0, 0.0, -15.0);
    static cameraFront = vec3.fromValues(0.0, 0.0, 1.0);
    static cameraUp    = vec3.fromValues(0.0, 1.0, 0.0);

    static firstMouse = true;
    static yaw   = 90.0;
    static pitch =  0.0;
    static lastX =  800.0 / 2.0;
    static lastY =  600.0 / 2.0;
    static fov   =  45.0;

// timing
    static deltaTime = 0.0;	// time between current frame and last frame
    static lastFrame = 0.0;

    static aircraftStatus = {
        x: vec3.fromValues(1, 0, 0),
        y: vec3.fromValues(0, 1, 0),
        z: vec3.fromValues(0, 0, 1),
        location: vec3.fromValues(0, 0, 0),
        P: 0, // ratio of roll
        Q: 0, // ratio of pitch
        R: 0, // ratio of yaw
        U: 0.1, // speed X
        V: 0, // speed y
        W: 0,  // speed z
    }

    static isCrash = false;

    static Bullets = {
        bullets : [],
        timestep : 100,
        lastTriger : 0.0
    }

    static restart = () => {

// camera
        Env.cameraPos   = vec3.fromValues(0.0, 0.0, -15.0);
        Env.cameraFront = vec3.fromValues(0.0, 0.0, 1.0);
        Env.cameraUp    = vec3.fromValues(0.0, 1.0, 0.0);

        Env.firstMouse = true;
        Env.yaw   = 90.0;
        Env.pitch =  0.0;
        Env.lastX =  800.0 / 2.0;
        Env.lastY =  600.0 / 2.0;

        Env.aircraftStatus = {
            x: vec3.fromValues(1, 0, 0),
            y: vec3.fromValues(0, 1, 0),
            z: vec3.fromValues(0, 0, 1),
            location: vec3.fromValues(0, 0, 0),
            P: 0, // ratio of roll
            Q: 0, // ratio of pitch
            R: 0, // ratio of yaw
            U: 0.1, // speed X
            V: 0, // speed y
            W: 0,  // speed z
        }

        Env.isCrash = false;
    }

    static updateAircraftStatus = (Fx, Fy, Fz, Mx, My, Mz) => {
        if (Env.isCrash) {
            return;
        }
        const status = Env.aircraftStatus;
        const dU = Fx// - status.Q * status.W + status.R * status.V;
        const dW = Fz// - status.P * status.V + status.Q * status.U;
        const dQ = My// + status.P * status.R;
        const dV = Fy// - status.R * status.U + status.P * status.W;
        const dP = Mx// + status.Q * status.R;
        const dR = Mz// - status.P * status.Q;
        // console.log(My, status.Q, dQ);

        status.U += Env.deltaTime * dU;
        status.W += Env.deltaTime * dW;
        status.Q += Env.deltaTime * dQ;
        status.V += Env.deltaTime * dV;
        status.P += Env.deltaTime * dP;
        status.R += Env.deltaTime * dR;

        const yawMat = mat4.create();
        mat4.rotate(yawMat, yawMat, glMatrix.toRadian(Env.deltaTime * status.R), status.y);
        let t = vec4.fromValues(status.x[0], status.x[1], status.x[2], 1);
        vec4.transformMat4(t, t, yawMat);
        status.x = vec3.fromValues(t[0], t[1], t[2]);
        t = vec4.fromValues(status.z[0], status.z[1], status.z[2], 1);
        vec4.transformMat4(t, t, yawMat);
        status.z = vec3.fromValues(t[0], t[1], t[2]);

        const pitchMat = mat4.create();
        mat4.rotate(pitchMat, pitchMat, -glMatrix.toRadian(Env.deltaTime * status.Q), status.x);
        t = vec4.fromValues(status.y[0], status.y[1], status.y[2], 1);
        vec4.transformMat4(t, t, pitchMat);
        status.y = vec3.fromValues(t[0], t[1], t[2]);
        t = vec4.fromValues(status.z[0], status.z[1], status.z[2], 1);
        vec4.transformMat4(t, t, pitchMat);
        status.z = vec3.fromValues(t[0], t[1], t[2]);

        const rollMat = mat4.create();
        mat4.rotate(rollMat, rollMat, -glMatrix.toRadian(Env.deltaTime * status.P), status.z);
        t = vec4.fromValues(status.y[0], status.y[1], status.y[2], 1);
        vec4.transformMat4(t, t, rollMat);
        status.y = vec3.fromValues(t[0], t[1], t[2]);
        t = vec4.fromValues(status.x[0], status.x[1], status.x[2], 1);
        vec4.transformMat4(t, t, rollMat);
        status.x = vec3.fromValues(t[0], t[1], t[2]);

        // console.log(status.x, status.y, status.z)
        // console.log(status.location[2]);

        const locationDelta = new Float32Array([Env.deltaTime / 10 * status.U * status.z[0],
                Env.deltaTime / 10 * status.U * status.z[1],
                Env.deltaTime / 10 * status.U * status.z[2]]);
        // console.log(status.z[2]);

        status.location[0] += locationDelta[0];
        status.location[1] += locationDelta[1];
        status.location[2] += locationDelta[2];
        // console.log(status.location[2]);

    }


    static processInput() {
        const controlSpeed = 0.000005 * Env.deltaTime;
        let My = -Env.aircraftStatus.Q / Env.deltaTime / 2,
            Mx = -Env.aircraftStatus.P / Env.deltaTime / 2,
            Mz = -Env.aircraftStatus.R / Env.deltaTime / 2, Fx = 0;

        if (control.W) {
            My = controlSpeed;
        }
        if (control.S) {
            My = -controlSpeed;
        }
        if (control.A) {
            Mx = controlSpeed;
        }
        if (control.D) {
            Mx = -controlSpeed;
        }
        if (control.Q) {
            Mz = controlSpeed;
        }
        if (control.E) {
            Mz = -controlSpeed;
        }
        if (control.X) {
            Fx = controlSpeed;
        }
        this.updateAircraftStatus(Fx, 0, 0, Mx, My, Mz);
        if (control.F) {
            if (Env.lastFrame - Env.Bullets.lastTriger >= Env.Bullets.timestep) {
                Env.Bullets.lastTriger = Env.lastFrame
                Env.Bullets.bullets.push(new bullet())
            }
        }
        // console.log(Env.Bullets.bullets)
        Env.Bullets.bullets.forEach((bullet) => {
            vec3.scaleAndAdd(bullet.location, bullet.location, bullet.direction, bullet.velocity * Env.deltaTime)
            bullet.lifeSpan -= Env.deltaTime
        })
        Env.Bullets.bullets = Env.Bullets.bullets.filter(bullet => bullet.lifeSpan > 0)
        if (control.Space) {
            Env.cameraPos   = vec3.fromValues(0.0, 0.0, -15.0);
            Env.cameraFront = vec3.fromValues(0.0, 0.0, 1.0);
            Env.yaw   = 90.0;
            Env.pitch =  0.0;
            Env.cameraFront = vec3.clone(Env.aircraftStatus.z);

            const cameraLen = vec3.length(Env.cameraPos);

            Env.cameraPos = vec3.fromValues(cameraLen * -Env.cameraFront[0], cameraLen * -Env.cameraFront[1], cameraLen * -Env.cameraFront[2]);

            Env.pitch = Math.asin(Env.cameraFront[1]) * (180 / Math.PI);
            Env.yaw = Math.asin(Env.cameraFront[2] / Math.cos(glMatrix.toRadian(Env.pitch))) * (180 / Math.PI);

        }
    }

    static keydown_callback(e) {
        console.log(e.code + " is up")
        console.log(control)
        if (e.code === 'KeyW') {
            control.W = true;
        }
        if (e.code === 'KeyS') {
            control.S = true;
        }
        if (e.code === 'KeyA') {
            control.A = true;
        }
        if (e.code === 'KeyD') {
            control.D = true;
        }
        if (e.code === 'KeyQ') {
            control.Q = true;
        }
        if (e.code === 'KeyE') {
            control.E = true;
        }
        if (e.code === 'KeyX') {
            control.X = true;
        }
        if (e.code === 'KeyF') {
            control.F = true;
        }
        if (e.code === 'Space') {
            control.Space = true;
        }
        
    }

    
    static keyup_callback(e) {
        console.log(e.code + " is down")
        console.log(control)
        if (e.code === 'KeyW') {
            control.W = false;
        }
        if (e.code === 'KeyS') {
            control.S = false;
        }
        if (e.code === 'KeyA') {
            control.A = false;
        }
        if (e.code === 'KeyD') {
            control.D = false;
        }
        if (e.code === 'KeyQ') {
            control.Q = false;
        }
        if (e.code === 'KeyE') {
            control.E = false;
        }
        if (e.code === 'KeyX') {
            control.X = false;
        }
        if (e.code === 'KeyF') {
            control.F = false;
        }
        if (e.code === 'Space') {
            control.Space = false;
        }
    }

// framebuffer_size_callback(gl, window, width, height) {
//     gl.viewport(0, 0, width, height);
// }

// glfw: whenever the mouse moves, this callback is called
// -------------------------------------------------------
    static mousedown_callback(e) {
        control.leftButton = true;
    }
    static mouseup_callback(e) {
        control.leftButton = false;
        Env.firstMouse = true;
    }
    static mouse_callback(e) {
        if (!control.leftButton) {
            return
        }
        const xpos = e.clientX;
        const ypos = e.clientY;
        if (Env.firstMouse) {
            Env.lastX = xpos;
            Env.lastY = ypos;
            Env.firstMouse = false;
        }
        // TODO 

        let xoffset = xpos - Env.lastX;
        let yoffset = Env.lastY - ypos;
        Env.lastX = xpos;
        Env.lastY = ypos;

        let sensitivity = 0.1; // change this value to your liking
        xoffset *= sensitivity;
        yoffset *= sensitivity;

        Env.yaw += xoffset;
        Env.pitch += yoffset;

        // make sure that when Env.pitch is out of bounds, screen doesn't get flipped
        if (Env.pitch > 89.0)
            Env.pitch = 89.0;
        if (Env.pitch < -89.0)
            Env.pitch = -89.0;

        let front = vec3.create();
        front[0] = Math.cos(glMatrix.toRadian(Env.yaw)) * Math.cos(glMatrix.toRadian(Env.pitch));
        front[1] = Math.sin(glMatrix.toRadian(Env.pitch));
        front[2] = Math.sin(glMatrix.toRadian(Env.yaw)) * Math.cos(glMatrix.toRadian(Env.pitch));

        Env.cameraFront = vec3.normalize(front, front)



        const cameraLen = vec3.length(Env.cameraPos);

        //console.log(Env.cameraFront);

        Env.cameraPos = vec3.fromValues(cameraLen * -Env.cameraFront[0], cameraLen * -Env.cameraFront[1], cameraLen * -Env.cameraFront[2]);

    }

// glfw: whenever the mouse scroll wheel scrolls, this callback is called
// ----------------------------------------------------------------------
    static scroll_callback(window, xoffset, yoffset) {
        Env.fov -= yoffset;
        if (Env.fov < 1.0)
            Env.fov = 1.0;
        if (Env.fov > 45.0)
            Env.fov = 45.0;
    }
}

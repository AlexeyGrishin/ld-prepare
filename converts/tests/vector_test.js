let math = require('../src/math/vector');
let assert = require('chai').assert;

function n(array) {
    return array.map((num) => Math.abs(num) < 0.001 ? 0 : num)
}

describe("triangle normal", () => {
    describe("xy plane triangle", () => {
        const P1 = [-10, 0, 0];
        const P2 = [0, 10, 0];
        const P3 = [10, 0, 0];

        it("inner point z<0 shall look up", () => {
            let nv = math.triangleNormal(P1, P2, P3, [0, 0, -10]);
            assert.deepEqual(n(nv), [0, 0, 1]);
        });

        it("inner point z<0 - ccw order", () => {
            let nv = math.triangleNormal(P1, P2, P3, [0, 0, -10]);
            assert.deepEqual(nv.ccw, [P1, P3, P2]);
        });

        it("inner point z>0 shall look down", () => {
            let nv = math.triangleNormal(P1, P2, P3, [0, 0, 10]);
            assert.deepEqual(n(nv), [0, 0, -1]);
        });

        it("inner point z>0 - ccw order", () => {
            let nv = math.triangleNormal(P1, P2, P3, [0, 0, 10]);
            assert.deepEqual(nv.ccw, [P1, P2, P3]);
        });

    });

    describe("yz plane triangle", () => {
        const P1 = [0, -10, 0];
        const P2 = [0, 0, 10];
        const P3 = [0, 10, 0];
        it("inner point x<0 - shall look right", () => {
            let nv = math.triangleNormal(P1, P2, P3, [-10, 0, 0]);
            assert.deepEqual(n(nv), [1, 0, 0]);
        });
        it("inner point x<0 - ccw order", () => {
            let nv = math.triangleNormal(P1, P2, P3, [-10, 0, 0]);
            assert.deepEqual(nv.ccw, [P1, P3, P2]);
        });
    });


});
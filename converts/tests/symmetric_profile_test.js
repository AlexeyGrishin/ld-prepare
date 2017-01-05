var {StringArrayMask, getSymmetricProfile, getUv} = require('../src/projection_vertices_model');
var assert = require('chai').assert;

describe("symmetric profile", () => {

    it("for simple figure", () => {
        let mask = new StringArrayMask(
            " .. ",
            "....",
            " .. "
        );
        let edges = getSymmetricProfile(mask);
        assert.deepEqual(edges, [
            {start: [2,0], end: [1,0]},
            {start: [1,0], end: [1,1]},
            {start: [1,1], end: [0,1]},
            {start: [0,1], end: [0,2]},
            {start: [0,2], end: [1,2]},
            {start: [1,2], end: [1,3]},
            {start: [1,3], end: [2,3]},
        ])
    });

    it("for figure with long vertical line", () => {
        let mask = new StringArrayMask(
            " .. ",
            "....",
            " .. ",
            " .. "
        );
        let edges = getSymmetricProfile(mask);
        assert.deepEqual(edges, [
            {start: [2,0], end: [1,0]},
            {start: [1,0], end: [1,1]},
            {start: [1,1], end: [0,1]},
            {start: [0,1], end: [0,2]},
            {start: [0,2], end: [1,2]},
            {start: [1,2], end: [1,4]},
            {start: [1,4], end: [2,4]}
        ])
    });

    it("for figure with emptyness on top and bottom", () => {
       let mask = new StringArrayMask(
           "    ",
           " .. ",
           "     "
       );
        let edges = getSymmetricProfile(mask);
        assert.deepEqual(edges, [
            {start: [2,1], end: [1,1]},
            {start: [1,1], end: [1,2]},
            {start: [1,2], end: [2,2]}
        ])
    });

    it("for single point", () => {
        let mask = new StringArrayMask(
            ".."
        );
        let edges = getSymmetricProfile(mask);
        assert.deepEqual(edges, [
            {start: [1,0], end: [0,0]},
            {start: [0,0], end: [0,1]},
            {start: [0,1], end: [1,1]}
        ])
    })

});

describe("getUv", () => {
   it("shall work for single point profile", () => {
       let uv = getUv([
           {start: [1,0], end: [0,0]},
           {start: [0,0], end: [0,1]},
           {start: [0,1], end: [1,1]}]);
       assert.deepEqual(uv, [
           {start: [1,0], end: [0,0]},
           {start: [0,0], end: [0,0]},
           {start: [0,0], end: [1,0]}
       ])
   })
});

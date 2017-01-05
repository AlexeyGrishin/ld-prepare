var {StringArrayMask, getFlatProfile, getUv} = require('../src/projection_vertices_model');
var assert = require('chai').assert;

describe("flat profile", () => {

    it("for simple figure", () => {
        let mask = new StringArrayMask(
            "...",
            "..."
        );
        let rectangles = getFlatProfile(mask);
        assert.deepEqual(rectangles, [
            {start: [0, 0], end: [3, 2]},
        ])
    });

    it("for figure with 2 heights", () => {
        let mask = new StringArrayMask(
            "..  ",
            "...."
        );
        let rectangles = getFlatProfile(mask);
        assert.deepEqual(rectangles, [
            {start: [0, 0], end: [2, 2]},
            {start: [2, 1], end: [4, 2]},
        ])
    });
    it("for figure with a hole", () => {
        let mask = new StringArrayMask(
            "...",
            ". .",
            "..."
        );
        let rectangles = getFlatProfile(mask);
        assert.deepEqual(rectangles, [
            {start: [0,0], end: [3,1]},
            {start: [0,1], end: [1,3]},
            {start: [2,1], end: [3,3]},
            {start: [1,2], end: [2,3]}
        ])
    });
    it("for figure like H", () => {
        let mask = new StringArrayMask(
            ". .",
            "...",
            ". ."
        );
        let rectangles = getFlatProfile(mask);
        assert.deepEqual(rectangles, [
            {start: [0,0], end: [1,3]},
            {start: [2,0], end: [3,3]},
            {start: [1,1], end: [2,2]}
        ])
    })
});
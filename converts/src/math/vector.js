//sad that I have to introduce my own functions to be able just calculate dot/cross product
//without creating Objects and taking 1.5M libraries onboard

//implementations partially got from sylvester library
module.exports = {
    
    substract(v1, v2) {
        return [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]];
    },
    
    divide(v1, n) {
        return [v1[0]/n, v1[1]/n, v1[2]/n];  
    },
    
    dot(v1, v2) {
        return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
    },

    cross(v1, v2) {
        return [
            v1[1]*v2[2] - v1[2]*v2[1],
            v1[2]*v2[0] - v1[0]*v2[2],
            v1[0]*v2[1] - v1[1]*v2[0]
        ]
    },
    
    length: function(v1) {
        return Math.hypot(...v1);  
    },
    
    normalize: function(v1) {
        let l = this.length(v1);
        if (l !== 0) {
            return this.divide(v1, l);
        } else {
            return v1;
        }
    },

    opposite(v1) {
        return [-v1[0], -v1[1], -v1[2]];
    },

    triangleNormal(p1, p2, p3, innerPoint) {
        let v1 = this.substract(p2, p1);
        let v2 = this.substract(p3, p1);
        let norm = this.normalize(this.cross(v1, v2));
        if (this.dot(norm, this.substract(innerPoint, p1)) < 0) {
            norm = this.opposite(norm);
            norm.cw = [p1, p2, p3];
            norm.ccw = [p1, p3, p2];
        } else {
            norm.cw = [p1, p3, p2];
            norm.ccw = [p1, p2, p3];
        }
        return norm;
    },

    triangleCenter(p1, p2, p3) {
        return this.divide([p1[0] + p2[0] + p3[0], p1[1] + p2[1] + p3[1], p1[2] + p2[2] + p3[2]], 3);
    },
    

    isClockwise(p1, p2, p3, normal) {
        //http://stackoverflow.com/questions/11938766/how-to-order-3-points-counter-clockwise-around-normal
        return this.dot(normal, this.cross(this.substract(p2,p1), this.substract(p3,p1))) > 0;
    }

};
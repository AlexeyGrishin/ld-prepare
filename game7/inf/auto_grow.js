(function(global) {

    global.createAutoGrower = function(grid, delay = 1000) {
        timer = game.time.create();
        timer.loop(delay, () => {
            let toAdd = [];
            grid.forEach((val, x, y) => {
                if (!val) {
                    let total = grid.getCell(x, y)._total;
                    if (total >= 2 && total < 7 && Math.random() < 0.5) {
                        toAdd.push({x,y});
                    }
                }
            });
            toAdd.forEach(({x,y}) => grid.set(x, y, {i:true}))
        }, this);


        let started = false;

        return {
            start: function() {
                if (started) timer.resume(); else timer.start();
                started = true;
            },
            stop: function() {
                timer.pause();
            }
        }
    }
})(window);
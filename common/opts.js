var scWidth = 250;
var scHeight = 250;
var scScale = 1;

function initOptions(config, opts) {

    var parsedConfig = {};

    var parsers = {
        boolean: function(s) {return {"true": true, "false": false}[s]},
        int: function(s) { return parseInt(s);},
        str: function(s) { return s;},
        select: function(s) { return s;}
    };

    var controls = {
        select: function(key) {
            var inp = document.createElement("select");
            inp.innerHTML = config[key][2].map(function(opt) {
                return "<option value='" + opt + "'" + (parsedConfig[key] === opt ? " selected " : "") + " >" + opt + "</option>";
            }).join("");
            inp.addEventListener("change", function() {
                parsedConfig[key] = inp.options[inp.selectedIndex].value;
            });
            return inp;
        },
        boolean: function(key) {
            var inp = document.createElement("input");
            inp.type = "checkbox";
            inp.checked = parsedConfig[key];
            inp.addEventListener("change", function() {
                parsedConfig[key] = !parsedConfig[key];
            });
            return inp;
        },
        int: function(key) {
            var inp = document.createElement("input");
            inp.type = "number";
            inp.value = parsedConfig[key];
            inp.addEventListener("change", function() {
                parsedConfig[key] = parseInt(inp.value);
            });
            return inp;
        },
        str: function(key) {
            var inp = document.createElement("input");
            inp.value = parsedConfig[key];
            inp.addEventListener("change", function() {
                parsedConfig[key] = inp.value;
            });
            return inp;
        }
    };

    var query = parseLocation();

    for (var key in config) {
        if (config.hasOwnProperty(key)) {
            var type = config[key][0];
            var defValue = config[key][1];
            if (query.hasOwnProperty(key)) {
                parsedConfig[key] = parsers[type](query[key]);
            }
            if (parsedConfig[key] === undefined) {
                parsedConfig[key] = defValue;
            }
        }
    }

    prepareUI();


    return parsedConfig;


    function parseLocation() {
        var options = {};
        location.search.substring(1).split("&").forEach(function(pair) {
            var kv = pair.split("=").map(decodeURIComponent);
            options[kv[0]] = kv[1];
        });
        return options;
    }

    function composeLocation() {
        var pairs = [];
        for (var key in parsedConfig) {
            if (parsedConfig.hasOwnProperty(key)) {
                pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(parsedConfig[key].toString()));
            }
        }
        return pairs.join("&");
    }

    function send() {
        location.search = composeLocation();
    }

    function prepareUI() {
        var div = document.createElement("div");
        div.className = "options-ui";
        div.style.position = "fixed";
        div.style.right = 0;
        div.style.top = 0;
        div.style.width = Math.max(scWidth*scScale + 20, 200) + "px";
        div.style.padding = "10px";
        div.style.backgroundColor = "#cccccc";


        for (var key in parsedConfig) {
            if (parsedConfig.hasOwnProperty(key)) {
                var label = document.createElement("label");
                label.style.display = "block";
                var span = document.createElement("span");
                span.style.marginRight = "10px";
                span.innerHTML = key;
                var input = controls[config[key][0]](key);
                input.style.maxWidth = "100px";
                input.addEventListener("change", send);
                label.appendChild(span);
                label.appendChild(input);
                div.appendChild(label);
            }
        }
        document.body.appendChild(div);

        if (opts) {
            if (opts.screenshot) {
                var screenshotCanvas = null;
                var button = document.createElement("button");
                button.innerHTML = "screenshot";
                div.appendChild(button);
                button.addEventListener("click", function() {
                    if (!screenshotCanvas) {
                        screenshotCanvas = document.createElement("canvas");
                        screenshotCanvas.setAttribute("width", scWidth*scScale);
                        screenshotCanvas.setAttribute("height", scHeight*scScale);
                        div.appendChild(screenshotCanvas);
                    }
                    var ctx = screenshotCanvas.getContext("2d");
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(game.canvas,
                        opts.screenshot().x - scWidth/2,
                        opts.screenshot().y - scHeight/2,
                        scWidth, scHeight,
                        0, 0, scWidth*scScale, scHeight*scScale);
                });
            }
        }
    }
}




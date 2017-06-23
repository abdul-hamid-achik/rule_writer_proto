var json = require('./structure.json');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var scriptText = '';

var resizeWithLimitsTemplate = 'resizeWithLimits({{layer}}, \
1, getHeight({{safebox}})*{{heightFactor}}, \
getWidth({{safebox}})*{{widthLimit}}, getHeight({{safebox}}) * {{heightLimit}});';
var instanciateLayerTemplate = 'instanciateLayer({{layer}});';
var makeGroupTemplate = 'rule.makeGroup({{elements}})';
// initialize({
//     texts : true,
// 	graphics: true,
//     safebox : true,
//     canvas : true,
// 	checkVisibility: true
// });

// var graphics2 = instanciateLayer(graphics.layers[0]);

// var A = instanciateLayer(texts.layers[0]);
// var B = instanciateLayer(texts.layers[1]);
// var C = instanciateLayer(texts.layers[2]);

// resizeWithLimits(B, 1, getHeight(safebox)*.2, getWidth(safebox)*.9, getHeight(safebox) * 0.2);
// resizeWithLimits(C, 1, getHeight(safebox)*.2, getWidth(safebox)*.9, getHeight(safebox) * 0.2);

// resizeWithLimits(graphics2, 1, getHeight(safebox)*.4, getWidth(safebox)*.9, getHeight(safebox) * 0.5);

// var gap = getHeight(safebox)*.03;

// var Canchor = rule.getFirstNotExcluded(B,graphics2, A);
// var Banchor = rule.getFirstNotExcluded(graphics2, A);

// alignBottom(graphics2,A,gap);
// alignBottom(B,Banchor,gap);
// alignBottom(C,Canchor, gap);

// var composition = rule.makeGroup(A,B,C, graphics2);

// alignHorizontalCenter(composition,canvas);
// alignVerticalCenter(composition,canvas);

var treeWalker = function(tree, fn) {
    var i;

    if (tree.hasOwnProperty('layers') !== true) {
        return;
    }

    for (i = 0; i < tree.layers.length; i++) {
        fn(tree.layers[i], tree, i);
    }

    for (i = 0; i < tree.layers.length; i++) {
        treeWalker(tree.layers[i], fn);
    }
};

// 1) Safeboxes
var safeboxes, graphics, texts;
treeWalker(json, function(layer, tree, index) {
    if (layer.name === 'Safeboxes') {
        safeboxes = layer;
    }
    if (layer.name === 'Text') {
        texts = layer;
    }
    if (layer.name === 'Graphics') {
        graphics = layer;
    }
})

var selectedSafebox;
if (safeboxes.layers.length > 1) {
    var string = 'Select a safebox:\n';
    for (index in safeboxes.layers) {
        var safebox = safeboxes.layers[index];
        string = string + index + ') ' + safebox.name + "\n";
    }
    rl.question(string, function(answer) {
        // TODO: Log the answer in a database
        selectedSafebox = safeboxes.layers[answer];
        scriptText = 'var selectedSafebox = safeboxes.layers[' + 1 + ']; \n'
        rl.close();
    });
} else {
    selectedSafebox = safeboxes.layers[0];
    scriptText = 'var selectedSafebox = safeboxes.layers[0]; \n'
}


var textsList = [texts.layers[0], texts.layers[2]];

textsList.sort(function(a, b) {
    return a.y - b.y;
})
var graphicsList = [graphics.layers[0]];


var list = [texts.layers[0], texts.layers[1], texts.layers[2], graphics.layers[0]]
var buildLayers = function(list) {
    var result = [];
    list.map(function(layer, index) {
        var tmp = {
            index: null,
            declaration: null,
            layer: layer
        };
        if (layer.type == "Text") {
            tmp.index = 'T' + index;
        } else if (layer.type == "Graphic") {
            tmp.index = 'G' + index;
        }
        tmp.declaration = 'var ' + tmp.index + " = " + instanciateLayerTemplate.replace("{{layer}}", JSON.stringify(layer));
        result.push(tmp);
    });
    return result;
}

var sizeElements = function(list, selectedSafebox) {
    var result = [];
    list.map(function(item) {
        var widthLimit = item.layer.width / selectedSafebox.width;
        // var widthLimit = item.layer.width;

        var heightLimit = item.layer.height / selectedSafebox.height;
        // var heightLimit = item.layer.height;
        result.push(resizeWithLimitsTemplate
            .replace('{{layer}}', item.index)
            .replace(/{{safebox}}/g, "selectedSafebox")
            .replace('{{widthLimit}}', widthLimit)
            .replace('{{heightLimit}}', heightLimit));
    });
    return result.join('\n');
}

var groupElements = function(list, compositionName) {
    var result;
    var elements = list.map(function(item) {
        return item.index;
    }).join(',');
    result = makeGroupTemplate.replace("{{elements}}", elements)
    if (compositionName) {
        result = 'var ' + compositionName + ' = ' + result + ';';
    } else {
        result = 'var composition = ' + result + ';';
    }
    return "\n" + result;
};

var createGap = function(safebox, heightFactor)  {
    result = '\nvar gap = getHeight({{safebox}})*{{heightFactor}};'.replace('{{safebox}}', safebox).replace("{{heightFactor}}", heightFactor);
    return result;
}
var ruleWriter = function(selections, safebox)  {
    ruleWriter.texts = [];
    ruleWriter.graphics = [];
    selections.map(function(layer) {
        if (layer.type == "Text") {
            ruleWriter.texts.push(layer);
        } else if (layer.type == "Graphic") {
            ruleWriter.graphics.push(layer);
        }
    });

    ruleWriter.textsList = buildLayers(ruleWriter.texts);
    ruleWriter.graphicsList = buildLayers(ruleWriter.graphics);
    ruleWriter.textsList.map(function(item) {
        scriptText = scriptText + item.declaration + '\n';
    });
    ruleWriter.graphicsList.map(function(item) {
        scriptText = scriptText + item.declaration + '\n';
    });

    var toBeGrouped = ruleWriter.textsList.concat(ruleWriter.graphicsList);

    var sizeRules = sizeElements(toBeGrouped, selectedSafebox);

    ruleWriter.texts.sort(function(a, b) {
        return a.y - b.y;
    });

    var textsGap;
    ruleWriter.texts.map(function(text) {
        if (textsGap) {
            textsGap -= text.y;
        } else {
            textsGap = text.y;
        }
    });

    textsGap /= selectedSafebox.height;
    if (textsGap < 0) {
    	textsGap *= -1;
    }
    console.log(textsGap)
    scriptText = scriptText + sizeRules + createGap("selectedSafebox", textsGap);
    var grouped = groupElements(toBeGrouped);
    scriptText = scriptText + grouped;
    // console.log(ruleWriter.textsList, ruleWriter.graphicsList);
    console.log(scriptText);
}

console.log("size individual objects");
console.log("place in respect to each other");
console.log("group them");
console.log("place the group within the canvas");

ruleWriter(list, selectedSafebox);

// // console.log(safeboxes.layers[selectedSafebox]);
// var textsListR = buildLayers(textsList);
// // console.log(buildLayers(graphicsList));
// sizeElements(textsListR, selectedSafebox)

// var graphicsListR = buildLayers(graphicsList);
// // console.log(buildLayers(graphicsList));
// sizeElements(graphicsListR, selectedSafebox)
// console.log(sizeElements(graphicsList, safeboxes.layers[selectedSafebox]))

// eval(buildLayers(list))
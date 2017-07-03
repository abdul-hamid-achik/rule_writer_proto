// vertical order [done]
// ui to text blocks and graphics [done]
// read safeboxes [done]
// read heights -> safebox relative [done]
// read spacing -> safebox relative
// read position of objects [done]

var json = require('./structure.json');

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

var uiToTextAndGraphics = function (tree) {
    var list = [];
    treeWalker(tree, function (layer) {
        if (layer.name === "Text") {
            list = list.concat(layer.layers);
        }

        if (layer.name === "Graphic" || layer.name === "Graphics") {
            list = list.concat(layer.layers);
        }
    });
    return list;
};

// console.log("UI to text and graphics test: \n");
var list = uiToTextAndGraphics(json);
// console.log(list);

var verticalOrder = function (layers) {
    return layers.sort(function(a, b) {
        return a.y - b.y;
    });
};

// console.log("\nVertical order test: \n");
// var verticallyOrderedList = verticalOrder(list);
// console.log(verticallyOrderedList);

var readSafeboxes = function (tree) {
    var safeboxes;
    treeWalker(tree, function (layer) {
        if (layer.name === 'Safeboxes') {
            safeboxes = layer;
        }
    });

    return safeboxes;
};

// console.log("\nRead safeboxes test: \n");
var safeboxes = readSafeboxes(json);
// console.log(safeboxes);

var readHeights = function (safebox, layers) {
    return layers.map(function (layer, index, array) {
        return layer.height/safebox.height;
    });
};

// console.log("\nRead heights test: \n");
// var heightsList = readHeights(safeboxes.layers[0], verticallyOrderedList);
// console.log(heightsList);

var readSpacing = function (safebox, layers) {
    return layers.map(function (layer, index, array) {
        var previousLayer = array[index - 1];
        if (previousLayer) {
            return (layer.y - previousLayer.y) / safebox.height;
        }
    });
};

// console.log("\nRead spacing test: \n");
// var spacingList = readSpacing(safeboxes.layers[0], verticallyOrderedList);
// console.log(spacingList);

// check with navid
var positionOfObjects = function (list) {
    return list.map(function (item, index, array) {
        return [item.x, item.y];
    });
};

// console.log("\nPosition of objects");
// var positionOfObjectsList = positionOfObjects(verticallyOrderedList);
// console.log(positionOfObjectsList);

var resizeWithLimitsTemplate = '\nresizeWithLimits({{layer}}, 1, getHeight(safebox) * {{height}}, getWidth(safebox), getHeight(safebox) * {{height}});';
var instanciateLayerTemplate = 'instanciateLayer({{layer}});';
var makeGroupTemplate = 'rule.makeGroup({{elements}})';
var alignHorizontalCenterTemplate = "\nalignHorizontalCenter({{layer}}, safebox);"
var exclusionTemplate = 'var anchor = rule.getFirstNotExcluded({{layersAndCanvas}});\n\
var gap = getHeight({{safebox}}) * {{gapFactor}};\n\
alignBottom({{layer}}, anchor, gap);\n';

var newlist = list.filter(function (item) {
    if (item.type == "Text") {
        return item;
    }
});

var ruleWriter = function (safebox, texts, graphics) {
    var result = '\
initialize({\n\
    canvas : true,\n\
    safebox : true,\n\
    texts : true,\n\
    graphics : true,\n\
    initTexts : true,\n\
    checkVisibility : true\n\
});\n';

    result += 'var safebox = safeboxes.layers[' + safebox + '];';
    // size individual objects
    var textsHeights = readHeights(safeboxes.layers[safebox], texts);
    texts.map(function (item, index) {
        result += resizeWithLimitsTemplate
            .replace("{{layer}}", "texts['text" + item.name + "']")
            .replace(/{{height}}/g, textsHeights[index]);
    });
    if (graphics) {
    var textsHeights = readHeights(safebox, texts);
        texts.map(function (item, index) {
            result += resizeWithLimitsTemplate
                .replace("{{layer}}", "texts['text" + item.name + "']")
                .replace(/{{safebox}}/g, safebox)
                .replace("{{heightFactor}}", textsHeights[index])
                .replace("{{heightLimit}}", textsHeights[index])
        });
    }
    // place (align usually) in respect to each other
    console.log(readSpacing(safeboxes.layers[0], texts))
    texts.map(function (item, index) {
        result += alignHorizontalCenterTemplate
            .replace("{{layer}}", "texts['text" + item.name + "']");
    });
    // group them
    var elements = [];
    texts.map(function (item, index) {
        elements.push('texts[\'text'+index+'\']');
    });
    result += '\nvar composition = ' +makeGroupTemplate
            .replace("{{elements}}", elements.join(','));
    // place the group within the canvas
    result += "\nalignHorizontalCenter(composition,canvas);\nalignVerticalCenter(composition,canvas);"
    console.log(result);
};

ruleWriter(0, newlist);
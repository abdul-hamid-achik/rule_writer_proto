var json = require('./structure.json');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var skeleton = "\
initialize({\n\
    canvas : true,\n\
    safebox : true,\n\
    texts : true,\n\
    graphics : true,\n\
    initTexts : true,\n\
    checkVisibility : true\n\
});\n\
\
\n// Resize all elements\
{{resizeAllElements}}\n\
\
\n// Center to the safebox all elements\
{{centerToSafebox}}\n\
\
\n// Align text2 to text1 with exclusion considered\
{{exclusion}}\n\
\
\n// Group the text and graphic layers for final adjustment to canvas\
{{groupAndFinalAdjustment}}\n\
";

var resizeWithLimitsTemplate = '\nresizeWithLimits({{layer}}, 1, getHeight({{safebox}}) * {{heightFactor}}, getWidth({{safebox}}) * {{widthLimit}}, getHeight({{safebox}}) * {{heightLimit}});';
var instanciateLayerTemplate = 'instanciateLayer({{layer}});';
var makeGroupTemplate = 'rule.makeGroup({{elements}})';
var alignHorizontalCenterTemplate = "\nalignHorizontalCenter({{layer}}, {{safebox}});"
var exclusionTemplate = 'var anchor = rule.getFirstNotExcluded({{layersAndCanvas}});\n\
var gap = getHeight({{safebox}}) * {{gapFactor}};\n\
alignBottom({{layer}}, anchor, gap);\n';
var resizeAllElements = "";

var centerToSafebox = "";

var exclusion = "";

var groupAndFinalAdjustment = "";

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

var ruleWriter = function ruleWriter (list, safebox) {
    var result = '\n';
    list.map(function (item) {
        result += resizeWithLimits(item.declaration, safebox.declaration, 0.99, item.layer.width / safebox.object.width, item.layer.height / safebox.object.height);
    });

    resizeAllElements = result;

    result = '\n';
    list.map(function (item) {
        result += alignHorizontalCenter(item.declaration, safebox.declaration);
    });

    centerToSafebox = result;

    // var anchor = rule.getFirstNotExcluded({{layersAndCanvas}});
    // var gap = getHeight({{safebox}}) * {{gapFactor}};
    // alignBottom({{layer}}, anchor, gap);

    tmpList = [];
    result = '\n';
    var lastGap = null;
    list.map(function (item, index, array) {
        if (item.type == "Text") {
            tmpList.push(item);
            var previousItem = array[index - 1];
            var gapFactor;
            if (previousItem) {
                gapFactor = "DEMO_GAP_FACTOR"
            } else {
                gapFactor = "DEMO_GAP_FACTOR"
            }
            result += exclusion(tmpList, safebox.declaration, gapFactor, item.declaration);
        }
    });
    console.log(skeleton.replace("{{resizeAllElements}}", resizeAllElements).replace("{{centerToSafebox}}", centerToSafebox));
};

var exclusion = function (layersAndCanvas, safebox, gapFactor, layer) {
    return exclusionTemplate
        .replace("{{layersAndCanvas}}", layersAndCanvas.join(',') + ", canvas")
        .replace("{{safebox}}", safebox)
        .replace("{{gapFactor}}", gapFactor)
        .replace("{{layer}}", layer)
};

var alignHorizontalCenter = function (layer, safebox) {
    return alignHorizontalCenterTemplate
        .replace("{{layer}}", layer)
        .replace("{{safebox}}", safebox);
};

var resizeWithLimits = function (layer, safebox, heightFactor, widthLimit, heightLimit) {
    return resizeWithLimitsTemplate
        .replace("{{layer}}", layer)
        .replace(/{{safebox}}/g, safebox)
        .replace("{{heightFactor}}", heightFactor)
        .replace("{{widthLimit}}", widthLimit)
        .replace("{{heightLimit}}", heightLimit);
}
var calculateGaps = function calculateGaps () {};

var scriptWriter = function scriptWriter() {
    var safeboxes, graphics, texts;
    treeWalker(json, function(layer, tree, index) {
        if (layer.name === 'Safeboxes') {
            safeboxes = layer;
        }
        if (layer.name === 'Text') {
            texts = layer;
        }
        if (layer.name === 'Graphics' || layer.name === 'Graphic') {
            graphics = layer;
        }
    });

    var selectedSafebox, scriptText, nextStep;
var textsSelection = function () {
        nextStep = graphicsSelection;
        string = 'Select Texts to use:\n';
        for (index in texts.layers) {
            var text = {
                index: index,
                object: texts.layers[index]
            };
            string = string + index + ") " + text.object.contents + "\n";
        }
        string += "\nUse comas to separate values: "
        rl.question(string, function (answer) {
            var answers = answer.split(',');
            textsSelection = answers;
            nextStep();
        });
    }
    if (safeboxes.layers.length > 1) {
        var string = 'Select a safebox:\n';
        for (index in safeboxes.layers) {
            var safebox = safeboxes.layers[index];
            string = string + index + ') ' + safebox.name + "\n";
        }
        rl.question(string, function (answer) {
            selectedSafebox = {
                index: answer,
                declaration: 'safeboxes.layers[' + answer + ']',
                object: safeboxes.layers[answer]
            };
            nextStep();
        });
    } else {
        selectedSafebox = {
            index: 0,
            declaration: 'safeboxes.layers[0]',
            object: safeboxes.layers[0]
        };
        textsSelection();
    }


    

    var graphicsSelection = function () {
        nextStep = runRuleWriter;
        string = 'Select Graphics to use:\n';
        for (index in graphics.layers) {
            var graphic = {
                index: index,
                object: graphics.layers[index]
            };
            string = string + index + ") " + graphics.layers[index].name + "\n";
        }
        string += "\nUse comas to separate values: "
        rl.question(string, function (answer) {
            var answers = answer.split(',');
            graphicsSelection = answers;
            nextStep();
        });

    };

    var runRuleWriter = function () {
        var textsList = [];
        textsSelection.map(function (item) {
            var object = {
                index: item,
                type: 'Text',
                declaration: 'texts.layers[\'text' + item + '\']',
                layer: texts.layers[item]
            }
            textsList.push(object);
        });
        var graphicsList = [];
        graphicsSelection.map(function (item) {
            var object = {
                index: item,
                type: 'Graphic',
                declaration: 'graphics.layers[' + item + ']',
                layer: graphics.layers[item]
            }
            graphicsList.push(object);
        });

        var list = graphicsList.concat(textsList);

        scriptText = ruleWriter(list, selectedSafebox);
    };

    nextStep = textsSelection;
}

scriptWriter();
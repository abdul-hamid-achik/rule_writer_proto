var json = require('./structure.json');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var skeleton = "\
initialize({\
    canvas : true,\
    safebox : true,\
    texts : true,\
    graphics : true,\
    initTexts : true,\
    checkVisibility : true\
});\
\
// Resize all elements\
{{resizeAllElements}}\
\
// Center to the safebox all elements\
{{centerToSafebox}}\
\
// Align text2 to text1 with exclusion considered\
{{exclusion}}\
\
// Group the text and graphic layers for final adjustment to canvas\
{{groupAndFinalAdjustment}}\
";

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

var steps = {
        safeboxSelection: function (answer) {
                console.log(answer)
                if (answer) {
            selectedSafebox = {
                index: answer,
                declaration: 'var selectedSafebox = safeboxes.layers[' + answer + ']; \n',
                object: safeboxes.layers[answer]
            };

            scriptText = ruleWriter(list, selectedSafebox);
                } else {
            selectedSafebox = {
                index: 0,
                declaration: 'var selectedSafebox = safeboxes.layers[0]; \n',
                object: safeboxes.layers[answer]
            };

            scriptText = ruleWriter(list, selectedSafebox);
                }
        }
}
var ruleWriter = function ruleWriter () {};

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

    var selectedSafebox, scriptText;

    if (safeboxes.layers.length > 1) {
        var string = 'Select a safebox:\n';
        for (index in safeboxes.layers) {
            var safebox = safeboxes.layers[index];
            string = string + index + ') ' + safebox.name + "\n";
        }
        rl.question(string, function (answer) {
            if (answer) {
                selectedSafebox = {
                    index: answer,
                    declaration: 'var selectedSafebox = safeboxes.layers[' + answer + ']; \n',
                    object: safeboxes.layers[answer]
                };

                scriptText = ruleWriter(list, selectedSafebox);
            } else {
                selectedSafebox = {
                    index: 0,
                    declaration: 'var selectedSafebox = safeboxes.layers[0]; \n',
                    object: safeboxes.layers[answer]
                };

                scriptText = ruleWriter(list, selectedSafebox);
            }
        });

    } else {
                steps.selectedSafebox()
    }
    console.log(scriptText);
}

scriptWriter();
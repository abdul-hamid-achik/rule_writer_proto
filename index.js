var json = require('./structure.json');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


initialize({
    texts : true,
	graphics: true,
    safebox : true,
    canvas : true,
	checkVisibility: true
});
layer, widthFactor, heightFactor, widthLimit, heightLimit
var resizeWithLimitsTemplate = 'resizeWithLimits({{layer}}, \
{{widthFactor}}, getHeight({{heightFactor}})*{{heightFactorProportion}}, \
getWidth(safebox)*.9, getHeight(safebox) * 0.2);'
var graphics2 = instanciateLayer(graphics.layers[0]);

var A = instanciateLayer(texts.layers[0]);
var B = instanciateLayer(texts.layers[1]);
var C = instanciateLayer(texts.layers[2]);

resizeWithLimits(B, 1, getHeight(safebox)*.2, getWidth(safebox)*.9, getHeight(safebox) * 0.2);
resizeWithLimits(C, 1, getHeight(safebox)*.2, getWidth(safebox)*.9, getHeight(safebox) * 0.2);

resizeWithLimits(graphics2, 1, getHeight(safebox)*.4, getWidth(safebox)*.9, getHeight(safebox) * 0.5);

var gap = getHeight(safebox)*.03;

var Canchor = rule.getFirstNotExcluded(B,graphics2, A);
var Banchor = rule.getFirstNotExcluded(graphics2, A);

alignBottom(graphics2,A,gap);
alignBottom(B,Banchor,gap);
alignBottom(C,Canchor, gap);

var composition = rule.makeGroup(A,B,C, graphics2);

alignHorizontalCenter(composition,canvas);
alignVerticalCenter(composition,canvas);

var treeWalker = function (tree, fn) {
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
treeWalker(json, function (layer, tree, index) {
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

console.log("safeboxes", safeboxes);
console.log("texts", texts);
console.log("graphics", graphics);

rl.question('What do you think of Node.js? ', function (answer) {
  // TODO: Log the answer in a database
  console.log(answer);

  rl.close();
});

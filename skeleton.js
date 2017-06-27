//skeleton
initialize({
    canvas : true,
    safebox : true,
    texts : true,
    graphics : true,
    initTexts : true,
    checkVisibility : true
});

// Resize all elements
resizeWithLimits(texts['text1'], getWidth(safebox) * 0.99, 1, getWidth(safebox), getHeight(safebox));
resizeWithLimits(texts['text2'], getWidth(safebox) * 0.99, 1, getWidth(safebox), getHeight(safebox));
resizeWithLimits(texts['text3'], getWidth(safebox) * 0.99, 1, getWidth(safebox), getHeight(safebox));
resizeWithLimits(graphics, getWidth(safebox) * 0.99, 1, getWidth(safebox), getHeight(safebox));

// Center to the safebox all elements
alignHorizontalCenter(texts['text1'], safebox);
alignHorizontalCenter(texts['text2'], safebox);
alignHorizontalCenter(texts['text3'], safebox);
alignHorizontalCenter(graphics, safebox);

// Align text2 to text1 with exclusion considered
var anchor = rule.getFirstNotExcluded(texts['text1'], canvas);
var gap = getHeight(safebox) * 0.99;
alignBottom(texts['text2'], anchor, gap);

// Align text3 to text2 with exclusion considered
var anchor = rule.getFirstNotExcluded(texts['text2'], texts['text1'], canvas);
var gap = getHeight(safebox) * 0.99;
alignBottom(texts['text2'], anchor, gap);

// Align graphic to text3 with exclusion considered
var anchor = rule.getFirstNotExcluded(texts['text3'], texts['text2'], texts['text1'], canvas);
var gap = getHeight(safebox) * 0.99;
alignBottom(graphics, anchor, gap);

// Group the text and graphic layers for final adjustment to canvas
var group = rule.makeGroup(texts['text1'], texts['text2'], texts['text3'], graphics);
resizeWithLimits(group, getWidth(canvas) * 0.75, 1, getWidth(canvas) * 0.75, getHeight(canvas) * 0.75);
alignVerticalCenter(group, canvas);
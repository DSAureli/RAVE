// Original author: Mateusz W //

(function()
{
	function UserSelection()
	{
		this.ranges = [];
		this.createRangeArray();
	}
	
	var NonIEPrototype =
	{
		constructor: UserSelection,
		
		createRangeArray: function()
		{
			var sel = window.getSelection();
		
			for (var i of range(sel.rangeCount))
			{
				this.ranges.push(sel.getRangeAt(i));
			}
		},
		
		intersectsNode: function(node)
		{
			var rangeArray = [];
			
			for (var range of this.ranges)
			{
				// this method is implemented in Firefox with Gecko before 1.9 and other non-IE browsers
				if (range.intersectsNode && range.intersectsNode(node))
				{
					rangeArray.push(range);
				}
				else
				{
					//var nodeRange = this.createRangeWithNode(node);
					var nodeRange = node.ownerDocument.createRange();
					nodeRange.selectNode(node);
					
					// if start of ranges[i] is before end of nodeRange && end of ranges[i] is after start of nodeRange
					if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) === -1 &&
						range.compareBoundaryPoints(Range.START_TO_END, nodeRange) === 1)
					{
						rangeArray.push(range);
					}
				}
			}
			
			return rangeArray;
		},
		/*
		createRangeWithNode: function(node)
		{
			var rangeWithNode = node.ownerDocument.createRange();
			
			try
			{
				rangeWithNode.selectNode(node);
			}
			catch (ex)
			{
				rangeWithNode.selectNodeContents(node);
			}
			
			rangeWithNode.selectNodeContents(node);
			return rangeWithNode;
		},*/
	};
	
	var IEPrototype =
	{
		constructor: UserSelection,
		
		createRangeArray: function()
		{
			return window.document.selection.createRange();
		},
		
		intersectsNode: function(node)
		{
			var rangeWithNode = this.createRangeWithNode(node);
			return this.containsRange(rangeWithNode);
		},
		
		createRangeWithNode: function(node)
		{
			var range = node.ownerDocument.selection.createRange();
			range.moveToElementText(node);
			return range;
		},
		
		containsRange: function(range)
		{
			return this.userRange.inRange(range);
		}
	};
	
	UserSelection.prototype = window.getSelection ? NonIEPrototype : IEPrototype;
	window.UserSelection = UserSelection;
}());
///////////////////////

//magari fai un oggetto per GeniusRange
//eh poi dovrei farne uno anche per GeniusOffset...

/*
// get the #text container given textIndex
	var temp = $(div);
	for (var index of pathArray)
	{
		temp = temp.children().eq(index);
	}
	console.log("\ntest\n\n" + "#text : " + temp.contents().eq(textIndex)[0]);
	console.log("#text.text() : " + temp.contents().eq(textIndex).text());
*/

function download(text, name, type)
{
	var a = document.body.appendChild(document.createElement("a"));
	a.href = "data:text/plain;base64," + btoa(JSON.stringify(text));
	a.download = name;
	a.click();
}
//download(obj, 'test.txt', 'text/plain');

function getDescendantTextElements(node)
{
	/** /
	return $(node).add($(node).find("*")).contents().filter(function()
	{
		return this.nodeType == Node.TEXT_NODE;
	});
	/**/
	//nope, we have to ensure the right order
	
	// do not optimize
	var nodes = [];
	$(node).contents().each(function()
	{
		if (this.nodeType == Node.TEXT_NODE)
			nodes.push(this);
		else
			nodes.pushArray(getDescendantTextElements(this));
	});
	return nodes;
}

function getGeniusPath(div, container)
{
	// get elements of path from container parent up to div
	var pathElements = [];
	var current = $(container).parent();
	
	while (!current.is(div))
	{
		pathElements.push(current);
		current = current.parent();
	}
	
	// get elements of path from div down to container parent
	pathElements.reverse();
	
	// get index-based path from div to container parent
	var pathArray = [];
	for (var elem of pathElements)
	{
		pathArray.push(elem.index());
	}
	
	// get #text node index in container's parent children collection
	var textIndex;
	current = $(container).parent();
	
	$(getDescendantTextElements(current)).each(function(index)
	{
		if ($(this).text() == $(container).text())
		{
			textIndex = index;
			return false; //breaks loop
		}
	});
	
	return {path: pathArray, index: textIndex};
}

function getGeniusRange(div, range)
{
	var startGeniusOffset = getGeniusPath(div, range.startContainer);
	var endGeniusOffset = getGeniusPath(div, range.endContainer);
	
	startGeniusOffset.offset = range.startOffset;
	endGeniusOffset.offset = range.endOffset;
	
	var geniusRange = {startOffset: startGeniusOffset, endOffset: endGeniusOffset};
	return geniusRange;
}

var geniusClass = ".genius_sel";

$(document).ready(function()
{
	$("#genius").click(function(event)
	{
		//set genius_column loading animation on
		// ...
		
		var userSel = new UserSelection();
		var newRanges = [];
		
		// divs of class genius_sel not descendant of other divs of same class
		$(geniusClass).not(geniusClass + " *").each(function(index, div)
		{
			// divRange is the range covering the whole div
			var divRange = document.createRange();
			divRange.selectNodeContents(div);
			
			// for each range intersecting with a genius_sel div
			for (var intRange of userSel.intersectsNode(div))
			{
				var newRange = intRange.cloneRange();
				var textNodes = getDescendantTextElements(div);
				
				// if startContainer is outside (before) div, set newRange startOffset to the beginning of div
				if (!($(div).hasDescendant(intRange.startContainer)))
					newRange.setStart(textNodes[0], 0);
				
				// if endContainer is outside (after) div, set newRange endOffset to the end of div
				if (!($(div).hasDescendant(intRange.endContainer)))
					newRange.setEnd(textNodes.lastElement(), textNodes.lastElement().length);
				
				// check if selection is not empty
				if (!newRange.collapsed)
					newRanges.push(getGeniusRange(div, newRange));
			}
		});
		//what if there are no genius_sel divs? -> newRanges == []
		//e se i range della selezione originaria non sono riferiti ad un #text, ma ad un nodo? cambia la semantica degli offset nei range...
		//per ora i range in newRanges non hanno riferimento al div genius_sel, come gestisco la cosa?
		
		console.log(newRanges);
		//download(newRanges, 'test.txt', 'text/plain');
		
		//deselect
		// ...
		
		//create new selection (color it too)
		// ...
		
		//create genius div for creating comment
		// ...
		
		// ...
	});
	
	$("#search").val("we");
	submitQuery();
});
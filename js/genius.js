function range(n)
{
	var a = [];
	for (var i = 0; i < n; i++)
		a[i] = i;
	return a;
}

// Is this needed?
String.prototype.insertAt = function(index, string)
{
	return this.slice(0, index) + string + this.slice(index);
};

// TOTEST
Array.prototype.pushArray = function(arr)
{
	for (var i in arr)
		this.push(arr[i]);
};

// TOTEST (check error message)
Array.prototype.removeAt = function(index)
{
	if (index > -1)
		this.splice(index, 1);
	else
		console.error("Array.prototype.remove error: negative index");
};

// TOTEST
Array.prototype.lastElement = function()
{
	return this[this.length - 1];
};

// TOTEST, needed?
jQuery.fn.hasDescendant = function(node)
{
	return this.has($(node)).length;
};

// TOTEST
jQuery.fn.isDescendantOf = function(node)
{
	return $(node).has(this).length;
};

var geniusClass = "genius_sel";


function nextNode(node)
{
	if (node.hasChildNodes())
	{
		return node.firstChild;
	}
	else
	{
		while (node && !node.nextSibling)
		{
			node = node.parentNode;
		}
		if (!node)
		{
			return null;
		}
		return node.nextSibling;
	}
}

function getRangeSelectedNodes(range)
{
	var node = range.startContainer;
	var endNode = range.endContainer;

	// Special case for a range that is contained within a single node
	if (node == endNode)
	{
		return [node];
	}

	// Iterate nodes until we hit the end container
	var rangeNodes = [];
	while (node && node != endNode)
	{
		//if ($(node).hasClass
		rangeNodes.push(node = nextNode(node));
	}

	// Add partially selected nodes at the start of the range
	node = range.startContainer;
	while (node && node != range.commonAncestorContainer)
	{
		rangeNodes.unshift(node);
		node = node.parentNode;
	}

	return rangeNodes;
}


// METHOD 1
/*
function splitRange(range)
{
	/** /
	var node = range.startContainer;
	while (node && !$(node).hasClass(geniusClass))
	{
		node = node.parentElement;
	}
	//
	
	var rangeArray = [];
	var endNode = range.endContainer;
	
	if (range.startContainer == range.endContainer)
	{
		rangeArray.push(range);
	}
	else
	{
		// ...
	}
	
	// collapse this in one line in the previous block
	for (var i in rangeArray)
	{
		if (!$(rangeArray[i].startContainer).hasClass(geniusClass))
		{
			rangeArray.remove(i);
		}
	}
	
		
	return rangeArray;
}
*/


// METHOD 2
/*
function nextNode(node)
{
	// ops
}

function splitRange(range)
{
	var start = range.start;
	var end = range.end;
	
	if start == end
	{
		if (start is genius_sel)
			return [range];
		
		return [];
	}
	
	var rangeArray = [];
	
	while (start != range.end)
	{
		if start is genius_sel
			rangeArray.add(start .. start.end);
		else
			var node = nextNode(start);
	}
	
	if (start is genius_sel)
	{
		rangeArray.add(start .. range.endoffset);
	}
	
	return rangeArray;
}
*/


// METHOD 3
// FINAL, TOTEST
// what about allow selection only on genius_sel nodes?
/*
function nextNode(node)
{
	if (node.hasChildNodes())
	{
		return node.firstChild;
	}
	else
	{
		while (node && !node.nextSibling)
			node = node.parentNode;
		
		if (!node)
			return null;
		
		return node.nextSibling;
	}
}

function getRangeSelectedNodes(range)
{
	var node = range.startContainer;
	var endNode = range.endContainer;

	// probably to be removed
	// no, it must be there, just fix it
	if (node == endNode)
	{
		var selNode = $(node).closest("." + geniusClass);
		//if ($(node).hasClass(geniusClass))
		if (selNode.length)
			//return [node];
			return [selNode[0]]; // ?
		else
			return [];
	}
	
	// if have ancestor genius_sel then node = that ancestor, otherwise assign common ancestor to it
	// otherwise or anyway?
	while (node && node != range.commonAncestorContainer)
		node = node.parentNode;
	// must not do this before the while! if there's a node that is sibling of the first selected
	// and positioned before it, the former will be marked as selected... but only if it's genius_sel...
	// and if the "common ancestor" is genius_sel it won't be marked... what a mess
	// maybe i should just check if an ancestor of start is genius_sel: if there's one,
	// then add it to the array and assign it to node

	var rangeNodes = [];
	while (node && node != endNode)
	{
		// lastElement can be undefined (should not be a problem, condition should be true)
		if ($(node).hasClass(geniusClass) && !$(node).isDescendantOf(rangeNodes.lastElement()))
			rangeNodes.push(node);
		
		node = nextNode(node);
	}

	return rangeNodes;
}

function splitRange(range)
{
	nodesArray = getRangeSelectedNodes(range);
	
	// what if nodeArray is empty?
	
	var start = range.startContainer;
	var end = range.endContainer;
	var rangeArray = [];
	
	// start should be child of the first node in array at the latest, at least I think
	if ($(start).isDescendantOf(nodesArray[0]))
	{
		var node = nodesArray[0];
		
		var nodeRange = document.createRange();
		nodeRange.selectNodeContents(node);
		
		// find offset from node
		while (range.compareBoundaryPoints(Range.START_TO_START, nodeRange))
		{
			nodeRange.setStart(node, nodeRange.startOffset + 1);
		}
		
		// add range relative to node
		rangeArray.push(nodeRange);
		
		// not sure about that
		nodesArray.removeAt(0);
	}
	
	// shift selection start to first node in array
	// what if nodeArray is empty?
	range.setStart(nodeArray[0], 0);
	// or maybe
	/** /
	var newRange = document.createRange();
	newRange.selectNodeContents(nodeArray[0]);
	range.setStart(newRange.startContainer, newRange.startOffset);
	/** /
	
	// for any node in array but the last one
	for (var i = 0; i < nodesArray.length - 1; i++)
	{
		// add range of the whole node
		var nodeRange = document.createRange();
		nodeRange.selectNodeContents(nodesArray[i]);
		rangeArray.push(nodeRange);
	}

	// if end is child of last node
	if ($(end).isDescendantOf(nodesArray[nodesArray.length - 1]))
	{
		var node = nodesArray[nodesArray.length - 1];
		
		var nodeRange = document.createRange();
		nodeRange.selectNodeContents(node);
		
		// find offset from node
		while (nodeRange.compareBoundaryPoints(Range.END_TO_END, range))
		{
			nodeRange.setEnd(node, nodeRange.endOffset - 1);
		}
		
		// add range relative to node
		rangeArray.push(nodeRange);
	}
	else
	{
		var nodeRange = document.createRange();
		nodeRange.selectNodeContents(node);
		
		// add range of the whole node
		rangeArray.push(nodeRange);
	}
	
	// return range array
	return rangeArray;
}
*/


// METHOD 4
// With partialContainment false only nodes among selected other ones give true
/** /
function splitRange(sel)
{
	var gselArray = $("." + geniusClass);
	
	if (!gselArray.length)
		return [];
	
	// Remove nodes that are child of other nodes in the same array
	gselArray.each(function(i, obj)
	{
		gselArray.each(function(j, obj2)
		{
			if (obj != obj2 && $(obj).hasDescendant(obj2))
			{
				gselArray.remove(j);
			}
		});
	});
	
	gselArray.each(function(i, node)
	{
		console.log(sel.containsNode(node, false));
	});
}

// !!!
for (var i = 0; i < a.length; i++)
{
	for (var j = 0; j < a.length; j++)
	{
		if (j != i)
			a.splice(j, 1);
	}
}
/**/

// Range.selectNode(node) or Range.selectNodeContents(node)


// 2017/08/01: FINISH IMLEMENTING METHOD 3 AND ALSO IMPLEMENT THIS:
//
// Best method (probably): in document.ready put that code:
// create array with all genius_sel divs
// remove all the ones that are descendant of any other div in the array
// for any range check its intersection with all the divs, and split the range accordingly


$(document).ready(function()
{
	$("#genius").click(function(event)
	{
		var sel = window.getSelection();
		var ranges = [];
		
		for (var i in range(sel.rangeCount))
		{
			// only needed if put inside mouseup event
			//if (s.getRangeAt(i).toString())
			//ranges.push(splitRange(sel.getRangeAt(i)));
			ranges.push(sel.getRangeAt(i));
		}
		
		splitRange(sel);
		
		/*TOREMOVE
		for (var i of range)
		{
			// if startContainer isnt genius_sel shift selection start
			// if endContainer isnt genius_sel shift selection end
			// sarebbe meglio farsi un vettore di elementi genius_sel e scremare da li
			
			if (!$(range.commonAncestorContainer).hasClass(geniusClass))
			{
				rangeSplit(range);
			}
		}
		*/
		
		// Firefox only
		/** /
		//console.log($(ranges[0].startContainer.parentElement).html());
		
		var parElem = ranges[0].startContainer.parentElement;
		while (!parElem.nextElementSibling)
			parElem = parElem.parentElement;
		
		ranges[0].setStartAfter(parElem);
		console.log(ranges[0].startContainer);
		/**/
		
		/** /
		//var nodes = ranges[0].extractContents();
		var nodes = ranges[0].cloneContents();
		var actual = [];
		$.each(nodes.childNodes, (i, node) =>
		{
			var find = $(document).find(node);
			actual.push(find);
		});
		/**/
		
		/** /
		var wat = $("#content_crossref .genius_sel:nth-child(2)");
		console.log(wat.prev());
		wat.before("a");
		var wat2 = $("#content_crossref .genius_sel:nth-child(2)::before");
		var wat3 = 3;
		/**/
		
		/** /
		var wat = $("#content_crossref .genius_sel:nth-child(2)");
		var ins = $("<p>we</p>");
		wat.prepend(ins);
		ranges[0].setStartAfter(ins[0]);
		ins.remove();
		/**/
		
		
		
		if (!node)
		{
			// ignore that piece of selection
		}
		
		//...?
		
		var nextNode = node.nextElementSibling;
		while (nextNode && !$(nextNode).hasClass(geniusClass))
		{
			nextNode = nextNode.nextElementSibling;
		}
		
		ranges[0].setStart(nextNode, 0);
		
		//
		
		
		// IE
		/** /
		var dio = ranges[0].startContainer.parentNode;
		var dio = window.getSelection().anchorNode.parentNode;
		console.log(ranges[0].setStartAfter(dio));
		/**/
		// PORCO DIO MICROSOFT FAI CAGARE
		/** /
		var selection = window.getSelection();
		var range = selection.getRangeAt(0);
		var textNodeParent = document.getSelection().anchorNode.parentNode;
		range.setStartAfter(textNodeParent);
		/**/
		
		
		
		//$("#column_genius").text("we");
		
		/** /
		var text = "";
		for (let i of ranges)
			text += i + "\n";
		
		window.alert(text);
		/**/
	});
	
	$("#search").val("we");
	submitQuery();
	
	// ENDTEST
});
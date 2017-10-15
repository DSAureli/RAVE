jQuery.fn.extend
({
	setGenius: function(id)
	{
		return this.each(function()
		{
			$(this).attr("genius", id);
		});
	}
});

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

function getDescendantTextElements(node)
{
	// do not optimize, the right order must be ensured
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

function getPath(div, container)
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

function getTextNode(div, obj)
{
	var temp = $(div);
	for (var index of obj.path)
	{
		temp = temp.children().eq(index);
	}
	return temp.contents().filter(function()
	{
		return this.nodeType == Node.TEXT_NODE;
	}).eq(obj.index)[0];
}

$(document).ready(function()
{
	$("#genius").click(function(event)
	{
		//set genius_column loading animation on
		// ...
		
		var newRanges = [];
		
		// genius divs not descendant of other genius divs
		$("[genius]").not("[genius] *").each(function(index, div)
		{
			var userSel = new UserSelection();
			
			// for each range intersecting a genius div
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
				
				// if selection is not empty
				if (!newRange.collapsed)
				{
					var geniusID = $(div).attr("genius");
					
					var start = getPath(div, newRange.startContainer);
					var end = getPath(div, newRange.endContainer);
					
					start.offset = newRange.startOffset;
					end.offset = newRange.endOffset;
					
					var geniusRange = {geniusID: geniusID, start: start, end: end};
					newRanges.push(geniusRange);
				}
			}
		});
		
		console.log(newRanges);
		window.getSelection().removeAllRanges();
		
		//create new selection (color it too)
		for (var range of newRanges)
		{
			var newRange = new Range();
			
			var startNode = getTextNode($('[genius="{0}"]'.format(range.geniusID)), range.start);
			var endNode = getTextNode($('[genius="{0}"]'.format(range.geniusID)), range.end);
			newRange.setStart(startNode, range.start.offset);
			newRange.setEnd(endNode, range.end.offset);
			
			window.getSelection().addRange(newRange);
		}
		
		//create genius div for creating comment
		// ...
		
		// ...
	});
	
	$("#search").val("we");
	submitQuery();
});
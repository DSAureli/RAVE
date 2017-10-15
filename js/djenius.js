function init()
{
	jQuery.fn.extend
	({
		setDjeniusID: function(id)
		{
			return this.each(function()
			{
				$(this).attr("DjeniusID", id);
			});
		},
		setAsDjeniusButton: function()
		{
			setDjeniusClickRoutine(this);
		}
	});
	
	class UserSelection
	{
		constructor(sel)
		{
			this.ranges = [];
			
			for (var i of range(sel.rangeCount))
			{
				this.ranges.push(sel.getRangeAt(i));
			}
		}
		
		intersectsNode(node)
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
		}
	}
	
	function getDescendantTextNodes(node)
	{
		// do not optimize, the right order must be ensured
		var nodes = [];
		$(node).contents().each(function()
		{
			if (this.nodeType == Node.TEXT_NODE)
				nodes.push(this);
			else
				nodes.pushArray(getDescendantTextNodes(this));
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
		
		$(getDescendantTextNodes(current)).each(function(index)
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
	
	function setDjeniusClickRoutine(elem)
	{
		$(elem).click(function(event)
		{
			//set djenius_column loading animation on
			// ...
			
			var newRanges = [];
			
			// Djenius divs not descendant of other Djenius divs
			$("[DjeniusID]").not("[DjeniusID] *").each(function(index, div)
			{
				var userSel = new UserSelection(window.getSelection());
				
				// for each range intersecting a Djenius div
				for (var intRange of userSel.intersectsNode(div))
				{
					var newRange = intRange.cloneRange();
					var textNodes = getDescendantTextNodes(div);
					
					// if startContainer is outside (before) div, set newRange startOffset to the beginning of div
					if (!($(div).hasDescendant(intRange.startContainer)))
						newRange.setStart(textNodes[0], 0);
					
					// if endContainer is outside (after) div, set newRange endOffset to the end of div
					if (!($(div).hasDescendant(intRange.endContainer)))
						newRange.setEnd(textNodes.lastElement(), textNodes.lastElement().length);
					
					// if selection is not empty
					if (!newRange.collapsed)
					{
						var DjeniusID = $(div).attr("DjeniusID");
						
						var start = getPath(div, newRange.startContainer);
						var end = getPath(div, newRange.endContainer);
						
						start.offset = newRange.startOffset;
						end.offset = newRange.endOffset;
						
						var djeniusRange = {DjeniusID: DjeniusID, start: start, end: end};
						newRanges.push(djeniusRange);
					}
				}
			});
			
			console.log(newRanges);
			window.getSelection().removeAllRanges();
			
			//create selection with newRanges
			for (var range of newRanges)
			{
				var newRange = new Range();
				
				var startNode = getTextNode($('[DjeniusID="{0}"]'.format(range.DjeniusID)), range.start);
				var endNode = getTextNode($('[DjeniusID="{0}"]'.format(range.DjeniusID)), range.end);
				newRange.setStart(startNode, range.start.offset);
				newRange.setEnd(endNode, range.end.offset);
				
				window.getSelection().addRange(newRange);
			}
			
			/*
			//create new selection (color it too)
			for (var range of newRanges)
			{
				var textNodes = getDescendantTextNodes($('[DjeniusID="{0}"]'.format(range.DjeniusID));
				for (var node of textNodes)
				{
					// ...
				}
				// ...
			}
			*/
			
			//create Djenius div for creating comment
			// ...
			
			// ...
		});
	}
};

$(document).ready(function()
{
	init();
	
	$("#search").val("we");
	submitQuery();
});
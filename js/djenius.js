(function()
{
	// public
	
	Djenius =
	{
		//il senso di prendere più nodi e un solo id?
		setSelectable: function(nodes, id)
		{
			/*
			if (id && (id is string && not empty string || id is int))
			{
			*/
				$(nodes).each(function()
				{
					$(this).attr("djenius_id", id);
				});
			/*
			}
			else
			{
				console.error("Djenius.setSelectable: id is an invalid unique identifier");
			}
			*/
		},
		setButton: function(elem)
		{
			var node = $(elem);
			if (node.length)
			{
				setDjeniusClickRoutine(node);
			}
			else
			{
				console.error("Djenius.setButton: invalid element");
			}
		}
	};
	
	// private
	
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
		
		intRanges(node)
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
	
	/*
	function getChildTextBlocks(node)
	{
		// do not optimize, the right order must be ensured
		
		var blocks = [];
		var nodes = [];
		
		$(node).contents().each(function()
		{
			if (this.nodeType == Node.TEXT_NODE)
			{
				nodes.push(this);
			}
			else if (nodes.length)
			{
				blocks.push(nodes);
				nodes = [];
			}
		});
		
		return blocks;
	}
	*/
	
	function getChildTextNodes(node)
	{
		return $(node).contents().filter(function()
		{
			return this.nodeType == Node.TEXT_NODE;
		});
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
	
	function getDescendantTextBlocks(node)
	{
		// do not optimize, the right order must be guaranteed
		
		var blocks = [];
		var nodes = [];
		
		// .not("br") also excludes text nodes...
		$(node).contents().filter(function()
		{
			return !($(this).is("br"));
		}
		).each(function()
		{
			if (this.nodeType == Node.TEXT_NODE)
			{
				nodes.push(this);
			}
			else
			{
				if (nodes.length)
				{
					blocks.push(nodes);
					nodes = [];
				}
				
				for (var block of getDescendantTextBlocks(this))
				{
					blocks.push(block);
				}
			}
		});
		
		if (nodes.length)
		{
			blocks.push(nodes);
		}
		
		return blocks;
	}
	
	function getRelativePath(div, node)
	{
		// get index-based path from div to node parent
		
		var pathArray = [];
		var current = $(node).parent();
		
		while (!current.is(div))
		{
			pathArray.push(current.index());
			current = current.parent();
		}
		
		pathArray.reverse();
		return pathArray;
	}
	
	function getTextNodeIndex(node)
	{
		// get #text node index relative to node parent
		
		var nodeIndex;
		
		getChildTextNodes($(node).parent()).each(function(index)
		{
			if ($(this).text() == $(node).text())
			{
				nodeIndex = index;
				return false; //breaks loop
			}
		});
		
		return nodeIndex;
	}

	function getTextNode(div, path, index)
	{
		var temp = $(div);
		for (var step of path)
		{
			temp = temp.children().eq(step);
		}
		return temp.contents().filter(function()
		{
			return this.nodeType == Node.TEXT_NODE;
		}
		).eq(index)[0];
	}
	
	function setDjeniusClickRoutine(elem)
	{
		$(elem).click(function(event)
		{
			//set djenius_column loading animation on
			// ...
			
			var newRanges = [];
			var userSel = new UserSelection(window.getSelection());
			
			// Djenius divs not descendant of other Djenius divs
			$("[djenius_id]").not("[djenius_id] *").each(function(index, div)
			{
				//var divTextNodes = getDescendantTextNodes(div);
				var textBlocks = getDescendantTextBlocks(div);
				
				// for each range of selection intersecting div
				for (var intRange of userSel.intRanges(div))
				{
					var djenius_id = $(div).attr("djenius_id");
					
					for (var block of textBlocks)
					{
						var firstRange = document.createRange();
						var lastRange = document.createRange();
						firstRange.selectNode(block[0]);
						lastRange.selectNode(block.lastElement());
						
						var newRange = intRange.cloneRange();
						
						if (newRange.compareBoundaryPoints(Range.START_TO_START, firstRange) === -1)
							newRange.setStart(block[0], 0);
						
						if (newRange.compareBoundaryPoints(Range.END_TO_END, lastRange) === 1)
							newRange.setEnd(block.lastElement(), block.lastElement().length);
						
						if (!newRange.collapsed)
						{
							newRanges.push(
							{
								djenius_id: djenius_id,
								path: getRelativePath(div, block[0]),
								start:
								{
									index: getTextNodeIndex(newRange.startContainer),
									offset: newRange.startOffset
								},
								end:
								{
									index: getTextNodeIndex(newRange.endContainer),
									offset: newRange.endOffset
								}
							});
						}
					}
				}
			});
			
			console.log(newRanges);
			window.getSelection().removeAllRanges();
			
			//create selection with newRanges
			for (var range of newRanges)
			{
				var newRange = new Range();
				
				var startNode = getTextNode($('[djenius_id="{0}"]'.format(range.djenius_id)), range.path, range.start.index);
				var endNode = getTextNode($('[djenius_id="{0}"]'.format(range.djenius_id)), range.path, range.end.index);
				newRange.setStart(startNode, range.start.offset);
				newRange.setEnd(endNode, range.end.offset);
				
				window.getSelection().addRange(newRange);
			}
			
			/*
			//create new selection (color it too)
			for (var range of newRanges)
			{
				var textNodes = getDescendantTextNodes($('[djenius_id="{0}"]'.format(range.djenius_id));
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
})();
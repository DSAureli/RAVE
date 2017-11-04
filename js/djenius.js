(function()
{
	// public
	
	Djenius =
	{
		setAnnotatable: function(node, id)
		{
			if (!($.type(id) === "number" || ($.type(id) === "string" && id.trim())))
			{
				console.error("'id' is an invalid unique identifier");
				return;
			}
			
			if (node.length > 1)
			{
				console.error("'node' parameter must contain only one element");
				return;
			}
			
			$(node).attr("djenius_id", id);
		},
		newAnnotation: newAnnotation
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
		
		// may not use .not("br") as it also excludes text nodes...
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
	
	function getTextNode(div, path, index)
	{
		for (var step of path)
			div = $(div).children().eq(step);
		return div.contents().eq(index)[0];
	}
	
	function getNewDjeniusRanges()
	{
		var newDjeniusRanges = [];
		var userSel = new UserSelection(window.getSelection());
		
		// Djenius divs not descendant of other Djenius divs
		$("[djenius_id]").not("[djenius_id] *").each(function(index, div)
		{
			$(div)[0].normalize();
			
			var textBlocks = getDescendantTextBlocks(div);
			var djenius_id = $(div).attr("djenius_id");
			
			// for each range of selection intersecting div
			for (var intRange of userSel.intRanges(div))
			{
				for (var block of textBlocks)
				{
					var firstDivNodeRange = document.createRange();
					var lastDivNodeRange = document.createRange();
					firstDivNodeRange.selectNodeContents($(block).first().get(0));
					lastDivNodeRange.selectNodeContents($(block).last().get(0));
					
					var newRange = intRange.cloneRange();
					
					if (newRange.compareBoundaryPoints(Range.START_TO_START, firstDivNodeRange) < 1)
						newRange.setStart(block[0], 0);
					
					if (newRange.compareBoundaryPoints(Range.END_TO_END, lastDivNodeRange) > -1)
						newRange.setEnd(block.lastElement(), block.lastElement().length);
					
					if (!newRange.collapsed && newRange.toString().trim())
					{
						newDjeniusRanges.push(
						{
							djeniusID: djenius_id,
							path: getRelativePath(div, block[0]),
							// had to write it that way because $(newRange.startContainer).index() would refer to
							// startContainer as a member of the previous "block" array, thus providing the index
							// of the container relative to the block made up of text-only non-br nodes
							startIndex: $(newRange.startContainer).parent().contents().index(newRange.startContainer),
							startOffset: newRange.startOffset,
							endIndex: $(newRange.endContainer).parent().contents().index(newRange.endContainer),
							endOffset: newRange.endOffset
						});
					}
				}
			}
		});
		
		return newDjeniusRanges;
	}
	
	function getNativeRanges(ranges)
	{
		var nativeRanges = [];
		
		for (var range of ranges)
		{
			var djeniusNode = $('[djenius_id="{0}"]'.format(range.djeniusID));
			djeniusNode[0].normalize();
			
			var newRange = new Range();
			var startNode = getTextNode(djeniusNode, range.path, range.startIndex);
			var endNode = getTextNode(djeniusNode, range.path, range.endIndex);
			
			newRange.setStart(startNode, range.startOffset);
			newRange.setEnd(endNode, range.endOffset);
			nativeRanges.push(newRange);
		}
		
		return nativeRanges;
	}
	
	var djeniusSpans = [];
	
	function removeHighlightings()
	{
		for (var span of djeniusSpans)
		{
			var spanParent = $(span).parent()[0];
			$(span).contents().unwrap();
			spanParent.normalize();
		}
		
		djeniusSpans = [];
	}
	
	function highlightDjeniusRanges(ranges)
	{
		removeHighlightings();
		var newNativeRanges = getNativeRanges(ranges);
		
		for (var range of newNativeRanges)
		{
			var newSpan = $("<span></span>")[0];
			$(newSpan).css("backgroundColor", "yellow");
			
			djeniusSpans.push(newSpan);
			range.surroundContents(newSpan);
		}
	}
	
	var djeniusRanges = [];
	
	function newAnnotation(handler)
	{
		/*
		if (!($.isFunction(handler)))
		{
			//error message
			return;
		}
		*/
		
		removeHighlightings();
		
		var newDjeniusRanges = getNewDjeniusRanges();
		console.log(newDjeniusRanges);
		
		highlightDjeniusRanges(djeniusRanges);
		
		if (newDjeniusRanges.length)
		{
			window.getSelection().removeAllRanges(); //maybe save it if it fails to load the new ranges to server
			highlightDjeniusRanges(newDjeniusRanges);
			
			//call function taken as argument that returns a string (ie. the comment) or something like null or undefined otherwise
			//if the string isn't null then compare newNativeRanges with allNativeRanges and split/arrange them accordingly (handle overlapping)
			//then finally add the new ones, properly adapted, to allNativeRanges
			
			//test
			var annotation = window.prompt("Please enter comment on selection", "default");
			if (annotation && annotation.trim())
			{
				djeniusRanges.pushArray(newDjeniusRanges);
				
				//proper handling:
				//send newDjeniusRanges to the server; ask server for all the annotations
				//if an error occurs, display an error message; otherwise, update djeniusRanges
			}
			else
			{
				// ...
				console.error("annotation failed");
			}
		}
		
		removeHighlightings();
		highlightDjeniusRanges(djeniusRanges);
	}
})();
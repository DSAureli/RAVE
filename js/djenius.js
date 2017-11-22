(function()
{
	////////////////////////
	//  public interface  //
	////////////////////////
	
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
			
			$(node).attr("djenius_sel_id", id);
		},
		newAnnotation: newAnnotation,
		
		//test
		removeSpan: removeSpan
	};
	
	
	/////////////////////
	//  private space  //
	/////////////////////
	
	Range.prototype.crossIntersectsNode = function(node) ////////////////////////////////////////////////////////////////////////////////isPointInRange?
	{
		// for any browser except Edge
		if (Range.prototype.intersectsNode)
		{
			return this.intersectsNode(node);
		}
		else
		{
			var nodeRange = node.ownerDocument.createRange();
			nodeRange.selectNode(node);
			
			// start of this is before end of nodeRange && end of ranges[i] is after start of this
			return (this.compareBoundaryPoints(Range.END_TO_START, nodeRange) === -1 &&
					this.compareBoundaryPoints(Range.START_TO_END, nodeRange) === 1);
		}
	}
	
	function getSelectionRanges()
	{
		var userSel = window.getSelection();
		var selRanges = [];
		
		for (var i of iter(userSel.rangeCount))
		{
			selRanges.push(userSel.getRangeAt(i));
		}
		
		return selRanges;
	}
	
	/*
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
	*/
	
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
	
	/*
	function getIntersectionRange(range, node)
	{
		var firstNode = $(node).first()[0];
		var lastNode = $(node).last()[0];
		
		var firstNodeRange = document.createRange();
		var lastNodeRange = document.createRange();
		
		firstNodeRange.selectNodeContents(firstNode);
		lastNodeRange.selectNodeContents(lastNode);
		
		var intRange = range.cloneRange();
		
		if (intRange.compareBoundaryPoints(Range.START_TO_START, firstNodeRange) < 1)
			intRange.setStart(firstNodeRange.startContainer, firstNodeRange.startOffset);
		
		if (intRange.compareBoundaryPoints(Range.END_TO_END, lastNodeRange) > -1)
			intRange.setEnd(lastNodeRange.endContainer, lastNodeRange.endOffset);
		
		if (intRange.collapsed || !intRange.toString().trim())
			return null;
		
		return intRange;
	}
	*/
	function getIntersectionRange(range_a, range_b)
	{
		var intRange = range_a.cloneRange();
		
		if (intRange.compareBoundaryPoints(Range.START_TO_START, range_b) < 1)
			intRange.setStart(range_b.startContainer, range_b.startOffset);
		
		if (intRange.compareBoundaryPoints(Range.END_TO_END, range_b) > -1)
			intRange.setEnd(range_b.endContainer, range_b.endOffset);
		
		if (intRange.collapsed || !intRange.toString().trim())
			return null;
		
		return intRange;
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
	
	function getNewDjeniusRanges()
	{
		var newDjeniusRanges = [];
		var selRanges = getSelectionRanges();
		
		// Djenius divs not descendant of other Djenius divs
		$("[djenius_sel_id]").not("[djenius_sel_id] *").each(function(index, div)
		{
			$(div)[0].normalize();
			
			var textBlocks = getDescendantTextBlocks(div);
			var djenius_sel_id = $(div).attr("djenius_sel_id");
			
			for (var range of selRanges)
			{
				for (var block of textBlocks)
				{
					/**/
					var firstBlockNodeRange = document.createRange();
					var lastBlockNodeRange = document.createRange();
					firstBlockNodeRange.selectNodeContents($(block).first()[0]);
					lastBlockNodeRange.selectNodeContents($(block).last()[0]);
					
					var blockRange = document.createRange();
					blockRange.setStart(firstBlockNodeRange.startContainer, firstBlockNodeRange.startOffset);
					blockRange.setEnd(lastBlockNodeRange.endContainer, lastBlockNodeRange.endOffset);
					/**/
					
					//var intRange = getIntersectionRange(range, block);
					var intRange = getIntersectionRange(range, blockRange);
					if (intRange)
					{
						newDjeniusRanges.push(
						{
							djeniusSelID: djenius_sel_id,
							path: getRelativePath(div, $(block).first()[0]),
							// had to write it that way because $(intRange.startContainer).index() would refer to
							// startContainer as a member of the previous "block" array, thus providing the index
							// of the container relative to the block made up of text-only non-br nodes
							startIndex: $(intRange.startContainer).parent().contents().index(intRange.startContainer),
							startOffset: intRange.startOffset,
							endIndex: $(intRange.endContainer).parent().contents().index(intRange.endContainer),
							endOffset: intRange.endOffset
						});
					}
				}
			}
		});
		
		return newDjeniusRanges;
	}
	
	function getTextNode(div, path, index)
	{
		for (var step of path)
			div = $(div).children().eq(step);
		return div.contents().eq(index)[0];
	}
	
	function getNativeRanges(ranges)
	{
		var nativeRanges = [];
		
		for (var range of ranges)
		{
			var djeniusNode = $("[djenius_sel_id='{0}']".format(range.djeniusSelID));
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
	
	function removeSpan(span)
	{
		// unwrapping a span changes any user selection intersecting it,
		// unless its start and end points are both outside the span
		
		var selRanges = getSelectionRanges();
		
		var spanRange = document.createRange();
		spanRange.selectNodeContents(span);
		
		var pairs = [];
		
		for (var range of selRanges)
		{
			if (range.crossIntersectsNode(span))
			{
				var start = false;
				var end = false;
				
				var tempRange = document.createRange();
				tempRange.setStart(spanRange.startContainer, spanRange.startOffset);
				tempRange.setEnd(spanRange.endContainer, spanRange.endOffset);
				
				if (spanRange.isPointInRange(range.startContainer, range.startOffset))
				{
					tempRange.setStart(range.startContainer, range.startOffset);
					start = true;
				}
				
				if (spanRange.isPointInRange(range.endContainer, range.endOffset))
				{
					tempRange.setEnd(range.endContainer, range.endOffset);
					end = true;
				}
				
				if (!start && !end)
					continue;
				
				var tempSpan = document.createElement("span");
				tempRange.surroundContents(tempSpan);
				
				pairs.push(
				{
					range: range,
					span: tempSpan,
					start: start,
					end: end
				});
			}
		}
		
		var spanParent = $(span).parent()[0];
		$(span).contents().unwrap();
		spanParent.normalize();
		
		for (var pair of pairs)
		{
			if (pair.start)
				pair.range.setStartBefore(pair.span);
			
			if (pair.end)
			{
				//pair.range.setEndAfter(pair.span); // NOPE
				pair.range.setEnd(pair.span.nextSibling, 0); // HAH!
			}
			
			var pairSpanParent = $(pair.span).parent()[0];
			$(pair.span).contents().unwrap();
			pairSpanParent.normalize();
		}
	}
	
	function removeHighlightings()
	{
		for (var span of djeniusSpans)
		{
			removeSpan(span);
		}
		
		djeniusSpans = [];
	}
	
	function getRelatedSpans(span)
	{
		// filter(Boolean) removes empty strings from array
		
		var span_ids = $(span).attr("djenius_ann_id").split(",").filter(Boolean);
		
		return $("[djenius_ann_id]").filter(function()
		{
			var node_ids = $(this).attr("djenius_ann_id").split(",").filter(Boolean);
			
			for (var id of span_ids)
			{
				if (node_ids.includes(id))
					return true;
			}
			
			return false;
		}).toArray();
	}
	
	function spanMouseEnterHandler(nodes)
	{
		$(nodes).css("backgroundColor", "orange");
	}
	
	function spanMouseLeaveHandler(nodes)
	{
		$(nodes).css("backgroundColor", "yellow");
	}
	
	function getRangesDifference(extRange, intRange)
	{
		var beforeRange = document.createRange();
		beforeRange.setStart(extRange.startContainer, extRange.startOffset);
		beforeRange.setEnd(intRange.startContainer, intRange.startOffset);
		
		var afterRange = document.createRange();
		afterRange.setStart(intRange.endContainer, intRange.endOffset);
		afterRange.setEnd(extRange.endContainer, extRange.endOffset);
		
		return [beforeRange, afterRange];
	}
	
	function createSpan(range, id)
	{
		var newSpan = document.createElement("span");
		
		$(newSpan).css("cursor", "pointer");
		$(newSpan).attr("djenius_ann_id", id);
		
		$(newSpan).hover
		(
			function()
			{
				spanMouseEnterHandler(getRelatedSpans(newSpan));
			},
			function()
			{
				spanMouseLeaveHandler(getRelatedSpans(newSpan));
			}
		);
		
		spanMouseLeaveHandler(newSpan);
		
		djeniusSpans.push(newSpan);
		range.surroundContents(newSpan);
	}
	
	/*
	function highlightNativeRanges(ranges, id)
	{
		for (var range of ranges)
		{
			var nonIntRange = true;
			
			//for (var span of djeniusSpans)
			for (var i = djeniusSpans.length - 1; i >= 0; i--)
			{
				var span = djeniusSpans[i];
				
				var intRange = getIntersectionRange(range, span);
				if (intRange)
				{
					var spanRange = document.createRange();
					spanRange.selectNodeContents(span);
					
					var diffRanges = getRangesDifference(spanRange, intRange);
					var span_id = $(span).attr("djenius_ann_id");
					
					removeSpan(span);
					djeniusSpans.removeAt(i);
					
					for (var range of diffRanges)
					{
						if (!range.collapsed)
						{
							createSpan(range, span_id);
						}
					}
					
					createSpan(intRange, span_id + "," + id);
					
					diffRanges = getRangesDifference(range, intRange);
					
					for (var range of diffRanges)
					{
						if (!range.collapsed)
						{
							ranges.push(range);
						}
					}
					
					nonIntRange = false;
					break;
				}
			}
			
			if (nonIntRange && !range.collapsed)
			{
				createSpan(range, id);
			}
		}
	}
	*/
	
	
	
	function highlightNativeRangePairs(idRanges)
	{
		var spanIdRanges = [];
		
		for (var idRange of idRanges)
		{
			var nonIntRange = true;
			
			for (var spanIdRange of spanIdRanges)	//no need for a normal backwards for?
			{
				var intRange = getIntersectionRange(idRange, spanIdRange);
				if (intRange)
				{
					var diffRanges = getRangesDifference(spanIdRange, intRange);
					spanIdRanges.removeAt(spanIdRanges.indexOf(spanIdRange));
					
					for (var diffRange of diffRanges)
					{
						if (!diffRange.collapsed)
						{
							diffRange.id = spanIdRange.id
							spanIdRanges.push(diffRange);
						}
					}
					
					intRange.id = spanIdRange.id + "," + idRange.id;
					spanIdRanges.push(intRange);
					
					diffRanges = getRangesDifference(idRange, intRange);
					//does this interfere with previous diffRange?
					//non dovrebbe, in quanto ridefinisce, ma non modifica?
					
					for (var diffRange of diffRanges)
					{
						if (!diffRange.collapsed)
						{
							diffRange.id = idRange.id;
							idRanges.push(diffRange);
						}
					}
					
					nonIntRange = false;
					break;
				}
			}
			
			if (nonIntRange && !idRange.collapsed)
			{
				spanIdRanges.push(idRange);
			}
		}
		
		for (var spanIdRange of spanIdRanges)
		{
			//add one to every range's start
			spanIdRange.setStart(spanIdRange.startContainer, spanIdRange.startOffset + 1);
		}
		
		for (var spanIdRange of spanIdRanges)
		{
			//add to document
			spanIdRange.setStart(spanIdRange.startContainer, spanIdRange.startOffset - 1);
			createSpan(spanIdRange, spanIdRange.id);
		}
	}
	
	function highlightDjeniusAnnotations(annotations)
	{
		//I think you should leave this here... forever...
		//useful for getNativeRanges?
		removeHighlightings();
		
		var idRanges = [];
		for (var annotation of djeniusAnnotations)
		{
			for (var range of getNativeRanges(annotation.ranges))
			{
				range.id = annotation.id;
				idRanges.push(range);
			}
		}
		
		highlightNativeRangePairs(idRanges);
	}
	
	function highlightDjeniusRanges(djRanges, id)
	{
		highlightDjeniusAnnotations(
		[
			{
				id: id,
				ranges: djRanges
			}
		]);
	}
	
	
	/*
	function highlightDjeniusRanges(ranges, id)
	{
		removeHighlightings();
		highlightNativeRanges(getNativeRanges(ranges), id);
	}
	
	function highlightDjeniusAnnotations()
	{
		removeHighlightings();
		
		var rangesObjects = [];
		for (var annotation of djeniusAnnotations)
		{
			rangesObjects.push(
			{
				id: annotation.id,
				ranges: getNativeRanges(annotation.ranges)
			});
		}
		for (var obj of rangesObjects)
		{
			highlightNativeRanges(obj.ranges, obj.id);
		}
	}
	*/
	
	
	var djeniusAnnotations = [];
	
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
		
		if (newDjeniusRanges.length)
		{
			window.getSelection().removeAllRanges(); //maybe save it if it fails to load the new ranges to server
			highlightDjeniusRanges(newDjeniusRanges, djeniusAnnotations.length);
			
			//call function taken as argument that returns a string (ie. the comment) or something like null or undefined otherwise
			//if the string isn't null then compare newNativeRanges with allNativeRanges and split/arrange them accordingly (handle overlapping)
			//then finally add the new ones, properly adapted, to allNativeRanges
			
			//test
			var annotation = window.prompt("Please enter comment on selection", "default");
			if (annotation && annotation.trim())
			{
				djeniusAnnotations.push(
				{
					id: djeniusAnnotations.length,
					//user: ... or editable: ...(true, false)
					//public: ... or visibility: ...
					ranges: newDjeniusRanges
					//comment: ...
				});
				
				//proper handling:
				//send newDjeniusRanges to the server; ask server for all the annotations
				//if an error occurs, display an error message; otherwise, update djeniusAnnotations
			}
			else
			{
				// ...
				console.error("annotation failed");
			}
		}
		
		highlightDjeniusAnnotations(djeniusAnnotations);
		console.log(djeniusAnnotations);
	}
})();
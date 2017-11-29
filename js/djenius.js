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
			
			// start of this is before end of nodeRange && end of this is after start of nodeRange
			return (this.compareBoundaryPoints(Range.END_TO_START, nodeRange) === -1 &&
					this.compareBoundaryPoints(Range.START_TO_END, nodeRange) === 1);
		}
	}
	
	Range.prototype.isEmpty = function()
	{
		return (this.collapsed || !this.toString());
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
	*/
	/**/
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
	/**/
	/** /
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
	/**/
	
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
		
		if (!intRange.isEmpty())
			return intRange;
		
		return null;
	}
	
	/** /
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
	/**/
	/**/
	function getRelativePath(div, node)
	{
		var pathArray = [];
		node = $(node);
		
		while (!node.is(div))
		{
			pathArray.push(node.parent().contents().index(node));
			node = node.parent();
		}
		
		pathArray.reverse();
		return pathArray;
	}
	/**/
	
	/** /
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
					var firstBlockNodeRange = document.createRange();
					var lastBlockNodeRange = document.createRange();
					firstBlockNodeRange.selectNodeContents($(block).first()[0]);
					lastBlockNodeRange.selectNodeContents($(block).last()[0]);
					
					var blockRange = document.createRange();
					blockRange.setStart(firstBlockNodeRange.startContainer, firstBlockNodeRange.startOffset);
					blockRange.setEnd(lastBlockNodeRange.endContainer, lastBlockNodeRange.endOffset);
					
					//var intRange = getIntersectionRange(range, block);
					var intRange = getIntersectionRange(range, blockRange);
					
					if (intRange && intRange.toString().trim())
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
	/**/
	function getNewDjeniusRanges()
	{
		var newDjeniusRanges = [];
		var selRanges = getSelectionRanges();
		
		// Djenius divs not descendant of other Djenius divs
		$("[djenius_sel_id]").not("[djenius_sel_id] *").each(function(index, div)
		{
			$(div)[0].normalize();
			
			var textNodes = getDescendantTextNodes(div);
			var djenius_sel_id = $(div).attr("djenius_sel_id");
			
			for (var range of selRanges)
			{
				for (var textNode of textNodes)
				{
					var textNodeRange = document.createRange();
					textNodeRange.selectNodeContents(textNode);
					
					var intRange = getIntersectionRange(range, textNodeRange);
					if (intRange && intRange.toString().trim())
					{
						newDjeniusRanges.push(
						{
							djeniusSelID: djenius_sel_id,
							path: getRelativePath(div, textNode),
							startOffset: intRange.startOffset,
							endOffset: intRange.endOffset
						});
					}
				}
			}
		});
		
		return newDjeniusRanges;
	}
	
	/** /
	function getTextNode(div, path, index)
	{
		for (var step of path)
			div = $(div).children().eq(step);
		return div.contents().eq(index)[0];
	}
	/**/
	/**/
	function getTextNode(div, path)
	{
		for (var step of path)
		{
			div = $(div).contents().eq(step);
		}
		
		return div[0];
	}
	/**/
	
	function getNativeRanges(ranges)
	{
		var nativeRanges = [];
		
		for (var range of ranges)
		{
			var djeniusNode = $("[djenius_sel_id='{0}']".format(range.djeniusSelID));
			djeniusNode[0].normalize();
			
			var newRange = document.createRange();
			/** /
			var startNode = getTextNode(djeniusNode, range.path, range.startIndex);
			var endNode = getTextNode(djeniusNode, range.path, range.endIndex);
			
			newRange.setStart(startNode, range.startOffset);
			newRange.setEnd(endNode, range.endOffset);
			/**/
			/**/
			var textNode = getTextNode(djeniusNode, range.path);
			newRange.setStart(textNode, range.startOffset);
			newRange.setEnd(textNode, range.endOffset);
			/**/
			
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
		
		//trying moving this after
		//spanParent.normalize();
		
		for (var pair of pairs)
		{
			if (pair.start)
				pair.range.setStartBefore(pair.span);
			
			if (pair.end)
			{
				//doesn't work always (try selecting the second half of a row, and then the whole row; fails for unknown reason)
				//pair.range.setEndAfter(pair.span); // NOPE!
				
				//doesn't work always (try selecting the last block two times in a row, last one does not have nextSibling)
				//pair.range.setEnd(pair.span.nextSibling, 0); // HAH! NOPE AGAIN!
				
				//maybe? nope...
				/*
				if (pair.span.nextSibling)
				{
					pair.range.setEnd(pair.span.nextSibling, 0);
				}
				else
				{
					pair.range.setEndAfter(pair.span);
				}
				*/
				
				//ok, now that normalize is done after, that should work fine
				pair.range.setEnd(pair.span.nextSibling, 0);
			}
			
			var pairSpanParent = $(pair.span).parent()[0];
			$(pair.span).contents().unwrap();
			$(pair.span).remove();
			pairSpanParent.normalize();
		}
		
		spanParent.normalize();
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
		
		/*TEST* /
		if ($(range.endContainer).is("br"))
		{
			range.setEndBefore(range.endContainer);		//end relative to the genius_sel div, must fix the end index here below by setting it to null and handle the null case in getTextNode
			//if that doesn't work just move that test back to where it was before
		}
		/**/
		
		/**/range.surroundContents(newSpan);/**/
		/*TEST - NOT WORKING (<br> are duplicated)* /
		newSpan.appendChild(range.extractContents());
		range.insertNode(newSpan);
		/**/
		
		return newSpan;
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
	
	
	
	function highlightIdRanges(idRanges)
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
					// internal diff //
					
					var diffRanges = getRangesDifference(spanIdRange, intRange);
					spanIdRanges.removeAt(spanIdRanges.indexOf(spanIdRange));
					
					for (var diffRange of diffRanges)
					{
						if (!diffRange.isEmpty())
						{
							diffRange.id = spanIdRange.id
							spanIdRanges.push(diffRange);
						}
					}
					
					intRange.id = spanIdRange.id + "," + idRange.id;
					spanIdRanges.push(intRange);
					
					// external diff //
					
					diffRanges = getRangesDifference(idRange, intRange);
					//does this interfere with previous diffRange?
					//non dovrebbe, in quanto ridefinisce, ma non modifica?
					
					for (var diffRange of diffRanges)
					{
						if (!diffRange.isEmpty())
						{
							diffRange.id = idRange.id;
							idRanges.push(diffRange);
						}
					}
					
					nonIntRange = false;
					break;
				}
			}
			
			if (nonIntRange && !idRange.isEmpty())
			{
				spanIdRanges.push(idRange);
			}
		}
		
		// ranges that begin immediately after another range are modified
		// if a node is added in the latter range
		/*
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
		*/
		//forse piuttosto che fare +1 e -1 è meglio fare una lista dei range da sistemare (quelli che iniziano alla fine del range al momento considerato),
		//quindi aggiungere il range considerato e settare ogni range nella lista all'offset 0 del range successivo l'attuale.
		//per la condizione per inserire nella lista potrei fare un range temporaneo che va dalla fine dell'attuale all'inizio del range A per ogni A dei range da
		//aggiungere != da attuale, e controllare con isEmpty() (se è vuoto coincidono)
		/** /
		for (var spanIdRange of spanIdRanges)
		{
			var needFix = null;
			//var rightContainer = null;
			//var rightOffset = null;
			
			for (var compRange of spanIdRanges)
			{
				if (compRange === spanIdRange || compRange.compareBoundaryPoints(Range.END_TO_START, spanIdRange) === -1)
					continue;
				
				var checkRange = document.createRange();
				checkRange.setStart(spanIdRange.endContainer, spanIdRange.endOffset);
				checkRange.setEnd(compRange.startContainer, compRange.startOffset);
				
				if (checkRange.isEmpty())
				{
					needFix = compRange;
					rightContainer = compRange.startContainer;
					rightOffset = compRange.startOffset;
					break;	//there sould be only one
				}
			}
			
			var newSpan = createSpan(spanIdRange, spanIdRange.id);
			
			if (needFix)
			{
				//needFix.setStart(rightContainer, rightOffset);
				needFix.setStartAfter(newSpan);
			}
		}
		/**/
		/**/
		for (var spanIdRange of spanIdRanges)
		{
			var needFix = null;
			
			for (var compRange of spanIdRanges)
			{
				if (compRange.compareBoundaryPoints(Range.END_TO_START, spanIdRange))
					continue;
				
				needFix = compRange;
				break;	//there sould be only one
			}
			
			var newSpan = createSpan(spanIdRange, spanIdRange.id);
			
			if (needFix)
			{
				needFix.setStartAfter(newSpan);
			}
		}
		/**/
	}
	
	function highlightDjeniusAnnotations(annotations)
	{
		//I think you should leave this here... forever...
		//useful for getNativeRanges?
		removeHighlightings();
		
		var idRanges = [];
		for (var annotation of annotations)
		{
			for (var range of getNativeRanges(annotation.ranges))
			{
				range.id = annotation.id;
				idRanges.push(range);
			}
		}
		
		highlightIdRanges(idRanges);
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
(function()
{
	////////////////////////
	//  public interface  //
	////////////////////////
	
	Djenius =
	{
		setAnnotatable: function(node, id)
		{
			if (!($.type(id) === "number" || (isString(id) && id.trim())))
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
		setIdleAnnotationColor: setIdleAnnotationColor,
		setActiveAnnotationColor: setActiveAnnotationColor,
		newAnnotation: newAnnotation,
		
		//test
		removeSpan: removeSpan
	};
	
	
	/////////////////////
	//  private space  //
	/////////////////////
	
	//*************//
	//  Utilities  //
	//*************//
	
	function iter(n)
	{
		var a = [];
		for (var i = 0; i < n; i++)
			a[i] = i;
		return a;
	}
	
	function isString(obj)
	{
		return (typeof obj === "string" || obj instanceof String);
	}
	
	String.prototype.format = function()
	{
		var content = this;
		for (var i=0; i < arguments.length; i++)
		{
			var replacement = '{' + i + '}';
			content = content.split(replacement).join(arguments[i]);
		}
		return content;
	};
	
	Array.prototype.pushArray = function(arr)
	{
		for (var i of arr)
			this.push(i);
		
		return arr.length;
	};
	
	Array.prototype.removeAt = function(index)
	{
		if (index > -1)
			return this.splice(index, 1);
		else
			console.error("Array.prototype.removeAt error: negative index");
	};
	
	//*********//
	//  Color  //
	//*********//
	
	function Color()
	{
		this.r = 0;
		this.g = 0;
		this.b = 0;
	}
	
	var idleColor = new Color();
	var activeColor = new Color();
	
	function getCssColor(color, alpha)
	{
		if (alpha != undefined && alpha != null)
		{
			return "rgba({0},{1},{2},{3})".format(color.r, color.g, color.b, alpha);
		}
		else
		{
			return "rgb({0},{1},{2})".format(color.r, color.g, color.b);
		}
	}
	
	function setAnnotationColor(obj, str)
	{
		if (obj && obj instanceof Color && isString(str))
		{
			var newElem = document.createElement("span");
			
			// must attach the element to DOM, otherwise it will work only on Firefox
			document.body.appendChild(newElem);
			var style = window.getComputedStyle(newElem);
			
			$(newElem).css("color", getCssColor(obj));
			var oldCssColor = style.getPropertyValue("color");
			
			$(newElem).css("color", str);
			var newCssColor = style.getPropertyValue("color");
			
			newElem.remove();
			
			// if the new color is different from the previous one it's legal
			if (newCssColor != "transparent" && newCssColor != oldCssColor)
			{
				var rgbArray = newCssColor.split("(")[1].split(")")[0].split(",");
				obj.r = Number(rgbArray[0].trim());
				obj.g = Number(rgbArray[1].trim());
				obj.b = Number(rgbArray[2].trim());
			}
		}
	}
	
	function setIdleAnnotationColor(str)
	{
		setAnnotationColor(idleColor, str);
	}
	
	function setActiveAnnotationColor(str)
	{
		setAnnotationColor(activeColor, str);
	}
	
	$("<style>").html(`
		[djenius_sel_id] [djenius_ann_id]
		{
			transition: background-color 100ms linear;
		}
		[djenius_sel_id] [djenius_ann_id]:hover
		{
			transition: background-color 100ms linear;
		}
	`).appendTo("head");
	
	setIdleAnnotationColor("rgb(140,140,140)");
	//setActiveAnnotationColor("rgb(255,255,100)");
	setActiveAnnotationColor("orange");
	
	//*****************//
	//  newAnnotation  //
	//*****************//
	
	Range.prototype.crossIntersectsNode = function(node)
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
	
	function getRelativePath(div, node)
	{
		var pathArray = [];
		var $node = $(node);
		
		while (!$node.is(div))
		{
			pathArray.push($node.parent().contents().index($node));
			$node = $node.parent();
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
	
	function getTextNode($div, path)
	{
		for (var step of path)
		{
			$div = $($div).contents().eq(step);
		}
		
		return $div[0];
	}
	
	function getNativeRanges(ranges)
	{
		var nativeRanges = [];
		
		for (var range of ranges)
		{
			var $djeniusNode = $("[djenius_sel_id='{0}']".format(range.djeniusSelID));
			$djeniusNode[0].normalize();
			
			var newRange = document.createRange();
			var textNode = getTextNode($djeniusNode, range.path);
			newRange.setStart(textNode, range.startOffset);
			newRange.setEnd(textNode, range.endOffset);
			
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
		
		for (var pair of pairs)
		{
			if (pair.start)
			{
				pair.range.setStartBefore(pair.span);
			}
			
			if (pair.end)
			{
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
	
	function getNodeDjeniusIds(span)
	{
		// filter(Boolean) removes empty strings from array
		return $(span).attr("djenius_ann_id").split(",").filter(x => x.trim()).filter(Boolean);
	}
	
	function getRelatedSpans(span)
	{
		var span_ids = getNodeDjeniusIds(span);
		
		return $("[djenius_ann_id]").filter(function()
		{
			var node_ids = getNodeDjeniusIds(this);
			
			for (var id of span_ids)
			{
				if (node_ids.includes(id))
					return true;
			}
			
			return false;
		}).toArray();
	}
	
	function spanMouseEnterHandler(relSpans, spanIds)
	{
		var fraction = 0.90 / spanIds.length;
		
		$(relSpans).each(function()
		{
			var commonIds = getNodeDjeniusIds(this).filter(x => spanIds.includes(x));
			var alpha = 0.10 + commonIds.length * fraction;
			
			$(this).css("backgroundColor", getCssColor(activeColor, alpha));
		});
	}
	
	function spanMouseLeaveHandler(relSpans)
	{
		var fraction = 0.90 / djeniusAnnotations.length;
		
		$(relSpans).each(function()
		{
			var alpha = 0.10 + getNodeDjeniusIds(this).length * fraction;
			$(this).css("backgroundColor", getCssColor(idleColor, alpha));
		});
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
				spanMouseEnterHandler(getRelatedSpans(newSpan), getNodeDjeniusIds(newSpan));
			},
			function()
			{
				spanMouseLeaveHandler(getRelatedSpans(newSpan));
			}
		);
		
		djeniusSpans.push(newSpan);
		range.surroundContents(newSpan);
		
		$(newSpan).trigger("mouseleave");
		
		return newSpan;
	}
	
	function highlightIdRanges(idRanges)
	{
		var spanIdRanges = [];
		
		for (var idRange of idRanges)
		{
			var nonIntRange = true;
			
			for (var spanIdRange of spanIdRanges)
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
	}
	
	function highlightDjeniusAnnotations(annotations)
	{
		removeHighlightings();
		
		var idRanges = [];
		for (var annotation of annotations)
		{
			for (var range of getNativeRanges(annotation.ranges))
			{
				range.id = String(annotation.id);
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
			$(djeniusSpans[0]).trigger("mouseenter");
			
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
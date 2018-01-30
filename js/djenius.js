(function()
{
	Djenius =
	{
		ServerRequest: ServerRequest,
		
		setAnnotatable: function(node, id)
		{
			if (!id || !isValidString(id))
			{
				console.error("Argument 'id' is not a valid unique identifier");
				return;
			}
			
			if (node && node.nodeType)
			{
				node.setAttribute("djenius_sel_id", id);
			}
			else
			{
				console.error("Argument 'node' is not a valid DOM element");
				return;
			}
		},
		setIgnore: function(node)
		{
			if (node && node.nodeType)
			{
				node.setAttribute("djenius_ignore", "");
			}
			else
			{
				console.error("Argument 'node' is not a valid DOM element");
				return;
			}
		},
		setNewUserSelection_Handler: function(handler)
		{
			if (!isFunction(handler))
			{
				console.error("Argument 'handler' must be a function");
				return;
			}
			
			newUserSelection_Handler = handler;
		},
		setGetAnnotationProperties_Handler: function(handler)
		{
			if (!isFunction(handler))
			{
				console.error("Argument 'handler' must be a function");
				return;
			}
			
			getAnnotationProperties_Handler = handler;
		},
		setChooseAnnotation_Handler: function(handler)
		{
			if (!isFunction(handler))
			{
				console.error("Argument 'handler' must be a function");
				return;
			}
			
			chooseAnnotation_Handler = handler;
		},
		setShowAnnotation_Handler: function(handler)
		{
			if (!isFunction(handler))
			{
				console.error("Argument 'handler' must be a function");
				return;
			}
			
			showAnnotation_Handler = handler;
		},
		setIdleAnnotationColor: setIdleAnnotationColor,
		setActiveAnnotationColor: setActiveAnnotationColor,
		askServerForInitialCollection: askServerForInitialCollection,
		newAnnotation: newAnnotation,
		getAnnotationsCount: getAnnotationsCount
	};
	
	//¯¯¯¯¯¯¯¯¯¯¯¯¯//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Utilities  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//_____________//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function iter(n)
	{
		let a = [];
		for (let i = 0; i < n; i++)
			a[i] = i;
		return a;
	}
	
	function isFunction(obj)
	{
		return (typeof obj == "function");
	}
	
	function isString(obj)
	{
		return (typeof obj === "string" || obj instanceof String);
	}
	
	function isValidString(obj)
	{
		return isString(obj) && obj.trim();
	}
	
	Array.prototype.pushArray = function(arr)
	{
		for (let i of arr)
			this.push(i);
		return arr.length;
	};
	
	Array.prototype.removeAt = function(index)
	{
		if (index > -1)
			return this.splice(index, 1);
		else
			console.error("Array.prototype.removeAt: negative index");
	};
	
	String.prototype.format = function()
	{
		let content = this;
		for (let i=0; i < arguments.length; i++)
		{
			let replacement = '{' + i + '}';
			content = content.split(replacement).join(arguments[i]);
		}
		return content;
	};
	
	function defer(fun, params, res, rej, fin)
	{
		let _resolve;
		let _reject;
		let promise = new Promise((resolve, reject) =>
		{
			_resolve = resolve;
			_reject = reject;
		});
		
		//promise.then(res).catch(rej).finally(fin);
		promise.then(res).catch(rej).then(fin, fin);
		
		try
		{
			fun(params, _resolve, _reject);
		}
		catch(err)
		{
			console.error("Exception in function '" + fun.name + "'\n" + err);
			_reject(err);
		}
		return promise;
		
	}
	
	//¯¯¯¯¯¯¯¯¯¯/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Colors  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//__________/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function Color()
	{
		this.r = 0;
		this.g = 0;
		this.b = 0;
	}
	
	let idleColor = new Color();
	let activeColor = new Color();
	
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
		if (!(obj && obj instanceof Color))
		{
			let errStr = "setAnnotationColor(obj, str):" + 
			"obj is not instance of Color";
			
			throw errStr;
		}
		else if (!isValidString(str))
		{
			let errStr = "setAnnotationColor(obj, str):" + 
			"str is not a valid string";
			
			throw errStr;
		}
		else
		{
			let newElem = document.createElement("span");
			
			// must attach the element to DOM, otherwise it will work only on Firefox
			document.body.appendChild(newElem);
			let style = window.getComputedStyle(newElem);
			
			$(newElem).css("color", getCssColor(obj));
			let oldCssColor = style.getPropertyValue("color");
			
			$(newElem).css("color", str);
			let newCssColor = style.getPropertyValue("color");
			
			newElem.remove();
			
			// if the new color is different from the previous one it's valid
			if (newCssColor != "transparent" && newCssColor != oldCssColor)
			{
				let rgbArray = newCssColor.split("(")[1].split(")")[0].split(",");
				obj.r = Number(rgbArray[0].trim());
				obj.g = Number(rgbArray[1].trim());
				obj.b = Number(rgbArray[2].trim());
			}
			else
			{
				let errStr = "setAnnotationColor(obj, str):" + 
				"str is not a valid color identifier";
			
				throw errStr;
			}
		}
	}
	
	function setIdleAnnotationColor(str)
	{
		try
		{
			setAnnotationColor(idleColor, str);
		}
		catch(err)
		{
			let errStr = "setIdleAnnotationColor(str) failed.\n";
			
			if (isValidString(err))
				errStr += ":\n" + reason;
			
			console.error(errStr);
		}
	}
	
	function setActiveAnnotationColor(str)
	{
		try
		{
			setAnnotationColor(activeColor, str);
		}
		catch(err)
		{
			let errStr = "setIdleAnnotationColor(str) failed.\n";
			
			if (isValidString(err))
				errStr += ":\n" + reason;
			
			console.error(errStr);
		}
	}
	
	$("<style>").html(`
		[djenius_sel_id] [djenius_ann_id]
		{
			cursor: pointer;
			transition: all 100ms linear;
		}
		[djenius_sel_id] [djenius_ann_id]:hover
		{
			transition: all 100ms linear;
		}
	`).appendTo("head");
	
	setIdleAnnotationColor("rgb(150,150,150)");
	setActiveAnnotationColor("orange");
	
	//¯¯¯¯¯¯¯¯¯¯¯¯///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Handlers  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//____________///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	let newUserSelection_Handler = function(params, resolve, reject)
	{
		console.log(params);
	};
	
	var selectionEndTimeout = null;
	
	document.onselectionchange = function()
	{
		if (selectionEndTimeout)
		{
			clearTimeout(selectionEndTimeout);
		}
		
		selectionEndTimeout = setTimeout(function()
		{
			document.dispatchEvent(new CustomEvent("selectionEnd",
			{
				bubbles: true,
				cancelable: true
			}));
		},
		500);
	};
	
	let newUserSelectionResolve;
	
	document.addEventListener("selectionEnd", function()
	{
		selectionEndTimeout = null;
		let intRanges = getNewDjeniusRanges(true);
		
		if (intRanges.length)
		{
			defer(function(params, resolve, reject)
			{
				if (isFunction(newUserSelectionResolve))
				{
					newUserSelectionResolve();
				}
				
				newUserSelectionResolve = resolve;
				newUserSelection_Handler(params, resolve, reject);
			},
			{
				ranges: intRanges
			},
			function(result)
			{
				// nothing
			},
			function(reason)
			{
				let errStr = "newUserSelection_Handler failed.\n" + 
				"defer(newUserSelection_Handler, ...)";
				
				if (isValidString(reason))
					errStr += ":\n" + reason;
				
				console.error(errStr);
			});
		}
	});
	
	$(`
	<style>
		[djenius_text_dialog]
		{
			border-width: 2px; 
			padding: 0;
			position: fixed;
		}
		@media only screen and (max-width: 767px)
		{
			[djenius_text_dialog]
			{
				top: 10%;
			}
		}
		[djenius_text_dialog] header
		{
			text-align: center;
			border-bottom: 2px solid;
			padding: 1em;
			-webkit-user-select: none;
			user-select: none;
		}
		[djenius_text_dialog] textarea
		{
			border: 2px solid;
			height: 10em;
			margin: 0.5em;
			resize: none;
			width: 25em;
		}
		[djenius_text_dialog] .flex_container
		{
			border-top: 2px solid;
			display: flex;
		}
		[djenius_text_dialog] .flex_container > *
		{
			flex: 1;
		}
		[djenius_text_dialog] button
		{
			border: none;
			background: none;
			padding: 1em;
			transition: background 50ms linear;
		}
		[djenius_text_dialog] button:first-child
		{
			border-right: 1px solid;
		}
		[djenius_text_dialog] button:last-child
		{
			border-left: 1px solid;
		}
		[djenius_text_dialog] button:hover
		{
			background: #ddd;
			transition: background 50ms linear;
		}
		[djenius_text_dialog] button:active
		{
			background: #bbb;
			transition: background 50ms linear;
		}
	</style>
	`).appendTo("head");
	
	let getAnnotationProperties_Handler = function(params, resolve, reject)
	{
		//resolve(window.prompt("Please enter annotation for selection", "default"));
		
		let dialog = $(`
		<dialog djenius_text_dialog>
			<header>Enter annotation</header>
			<textarea></textarea>
			<div class="flex_container">
				<button cancel>Cancel</button>
				<button ok>OK</button>
			</div>
		</dialog>
		`)[0];
		
		$(dialog.querySelector("button[cancel]")).click(function()
		{
			reject("Operation cancelled by user");
			dialog.close();
			dialog.remove();
		});
		
		$(dialog.querySelector("button[ok]")).click(function()
		{
			let anno = dialog.querySelector("textarea").value;
			if (anno.trim())
			{
				resolve(
				{
					annotation: anno
				});
				
				dialog.close();
				dialog.remove();
			}
		});
		
		document.body.appendChild(dialog);
		dialog.showModal();
	};
	
	$(`
	<style>
		[djenius_choice_dialog]
		{
			border-width: 2px; 
			padding: 0;
			position: fixed;
			transition: opacity 100ms linear;
			-webkit-user-select: none;
			user-select: none;
		}
		[djenius_choice_dialog] header
		{
			text-align: center;
			border-bottom: 2px solid;
			padding: 1em;
		}
		[djenius_choice_dialog] .vertical-menu
		{
			max-height: 300px;
			overflow-y: auto;
			width: 400px;
		}
		[djenius_choice_dialog] .vertical-menu a
		{
			background: none;
			display: flex;
			transition: background 50ms linear;
		}
		[djenius_choice_dialog] .vertical-menu a:hover
		{
			background: #ddd;
			transition: background 50ms linear;
		}
		[djenius_choice_dialog] .vertical-menu a:active
		{
			background: #bbb;
			transition: background 50ms linear;
		}
		[djenius_choice_dialog] .vertical-menu .id
		{
			border-right: 1px solid;
			flex: 1;
			overflow: hidden;
			padding: 0.75em;
			text-align: center;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		[djenius_choice_dialog] .vertical-menu .text
		{
			flex: 6;
			overflow: hidden;
			padding: 0.75em;
			padding-left: 1em;
			text-align: center;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		[djenius_choice_dialog] button
		{
			border: none;
			border-top: 2px solid;
			background: none;
			padding: 1em;
			transition: background 50ms linear;
			width: 100%;
		}
		[djenius_choice_dialog] button:hover
		{
			background: silver;
			transition: background 50ms linear;
		}
		[djenius_choice_dialog] button:active
		{
			background: darkgrey;
			transition: background 50ms linear;
		}
	</style>
	`).appendTo("head");
	
	let chooseAnnotation_Handler = function(params, resolve, reject)
	{
		// params = {spanIds, relSpans, anchor}
		
		let dialog = $(`
		<dialog djenius_choice_dialog>
			<header>Header</header>
			<div class="vertical-menu"></div>
			<button cancel>Cancel</button>
		</dialog>
		`)[0];
		
		console.log(params);
		
		let vertm = dialog.querySelector(".vertical-menu")
		
		if (params.anchor)
		{
			let idDiv = document.createElement("div");
			idDiv.classList.add("id");
			
			let linkDiv = document.createElement("div");
			linkDiv.classList.add("text");
			linkDiv.style.color = "blue";
			linkDiv.style.textDecoration = "underline";
			linkDiv.appendChild(document.createTextNode(params.anchor.text));
			
			let entry = document.createElement("a");
			
			$(entry).click(function()
			{
				dialog.close();
				dialog.remove();
				resolve(null);
			});
			
			entry.appendChild(idDiv);
			entry.appendChild(linkDiv);
			vertm.appendChild(entry);
		}
		
		for (let spanId of params.spanIds)
		{
			let idDiv = document.createElement("div");
			idDiv.classList.add("id");
			idDiv.appendChild(document.createTextNode(spanId));
			
			let annoText = params.relSpans
				.filter(x => x.getAttribute("djenius_ann_id").split(",").includes(spanId))
				.map(x => x.textContent.split("\n").join(" ").split("\t").join("")).join(" ");
			
			let textDiv = document.createElement("div");
			textDiv.classList.add("text");
			textDiv.appendChild(document.createTextNode(annoText));
			
			let entry = document.createElement("a");
			$(entry).hover(function()
			{
				dialog.style.opacity = 0.85;
				spanMouseEnterHandler(null, params.relSpans, [spanId]);
			},
			function()
			{
				dialog.style.opacity = 1;
				spanMouseLeaveHandler(null, params.relSpans);
			});
			
			$(entry).click(function()
			{
				spanMouseLeaveHandler(null, params.relSpans);
				
				dialog.close();
				dialog.remove();
				resolve(spanId);
			});
			
			entry.appendChild(idDiv);
			entry.appendChild(textDiv);
			vertm.appendChild(entry);
		}
		
		$(dialog.querySelector("button[cancel]")).click(function()
		{
			reject("Operation cancelled by user");
			dialog.close();
			dialog.remove();
		});
		
		document.body.appendChild(dialog);
		dialog.showModal();
	};
	
	let chooseAnchorOrAnnotation_Handler = function(params, resolve, reject)
	{
		// params = {anchor, span, spanIds, relSpans}
		
		defer(chooseAnnotation_Handler,
		{
			spanIds: params.spanIds,
			relSpans: params.relSpans,
			anchor: params.anchor
		},
		function(result)
		{
			resolve(result);
		},
		function(reason)
		{
			reject(reason);
		});
	}
	
	var ServerRequest = 
	{
		create: 0,
		read: 1,
		update: 2,
		delete: 3
	};
	
	let serverRequest_Handler = function(params, resolve, reject)
	{
		switch (params.request)
		{
			case ServerRequest.create:
				annotationsCollection.push(params.data);
				break;
			case ServerRequest.read:
				break;
			case ServerRequest.update:
				annotationsCollection.find(x => x.id == params.data.id).properties = params.data.properties;
				break;
			case ServerRequest.delete:
				annotationsCollection.removeAt(annotationsCollection.findIndex(x => x.id == params.data));
				break;
		}
		
		resolve(annotationsCollection);
	}
	
	// Keep the current shown annotation's reject callback, in order to ensure the promise fullfillment,
	// in case the library user forgets to do it, by calling it before any other action on any annotation
	let shownAnnotationReject;
	
	let showAnnotation_Handler = function(params, resolve, reject)
	{
		console.log(params.annotation);
	};
	
	function showAnnotation(annotation)
	{
		defer(function(params, resolve, reject)
		{
			if (isFunction(shownAnnotationReject))
			{
				shownAnnotationReject(null);
			}
			
			shownAnnotationReject = reject;
			showAnnotation_Handler(params, resolve, reject);
		},
		{
			annotation: annotation
		},
		function(properties)
		{
			// properties == null -> delete
			// properties != null -> update
			
			if (properties === undefined)
			{
				throw "showAnnotation_Handler: resolve(...) argument is undefined";
			}
			else
			{
				let request;
				let data;
				
				if (properties)
				{
					request = ServerRequest.update;
					data =
					{
						id: annotation.id,
						properties: properties
					}
				}
				else
				{
					request = ServerRequest.delete;
					data = annotation.id;
				}
				
				defer(serverRequest_Handler,
				{
					request: request,
					data: data
				},
				function(result)
				{
					updateAnnotationsCollection(result);
				},
				function(reason)
				{
					let errStr = "\nshowAnnotation_Handler";
					
					if (isValidString(reason))
						errStr += ":\n" + reason;
					
					throw errStr;
				});
			}
		},
		function(reason)
		{
			if (reason !== null)
			{
				let errStr = "Action on annotation failed.\n" + 
				"defer(showAnnotation_Handler, ...)";
				
				if (isValidString(reason))
					errStr += ":\n" + reason;
				
				console.error(errStr);
			}
		});
	}
	
	//¯¯¯¯¯¯¯¯¯//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Spans  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//_________//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	Range.prototype.crossIntersectsNode = function(node)
	{
		// for any browser except Edge
		if (Range.prototype.intersectsNode)
		{
			return this.intersectsNode(node);
		}
		else
		{
			let nodeRange = node.ownerDocument.createRange();
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
	
	let spansCollection = [];
	
	function removeSpan(span)
	{
		// unwrapping a span changes any user selection intersecting it,
		// unless its start and end points are both outside the span
		
		let selRanges = getSelectionRanges();
		
		let spanRange = document.createRange();
		spanRange.selectNodeContents(span);
		
		let pairs = [];
		
		for (let range of selRanges)
		{
			if (range.crossIntersectsNode(span))
			{
				let start = false;
				let end = false;
				
				let tempRange = document.createRange();
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
				
				let tempSpan = document.createElement("span");
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
		
		let spanParent = $(span).parent()[0];
		$(span).contents().unwrap();
		
		for (let pair of pairs)
		{
			if (pair.start)
			{
				pair.range.setStartBefore(pair.span);
			}
			
			if (pair.end)
			{
				pair.range.setEnd(pair.span.nextSibling, 0);
			}
			
			let pairSpanParent = $(pair.span).parent()[0];
			$(pair.span).contents().unwrap();
			$(pair.span).remove();
			pairSpanParent.normalize();
		}
		
		spanParent.normalize();
	}
	
	function removeHighlightings()
	{
		for (let span of spansCollection)
		{
			removeSpan(span);
		}
		
		spansCollection = [];
	}
	
	function getTextNode($div, path)
	{
		for (let step of path)
		{
			$div = $($div).contents().eq(step);
		}
		
		return $div[0];
	}
	
	function getNativeRanges(ranges)
	{
		let nativeRanges = [];
		
		for (let range of ranges)
		{
			let $djeniusNode = $("[djenius_sel_id='{0}']".format(range.djeniusSelID));
			$djeniusNode[0].normalize();
			
			let newRange = document.createRange();
			let textNode = getTextNode($djeniusNode, range.path);
			newRange.setStart(textNode, range.startOffset);
			newRange.setEnd(textNode, range.endOffset);
			
			nativeRanges.push(newRange);
		}
		
		return nativeRanges;
	}
	
	function getNodeDjeniusIds(span)
	{
		// filter(Boolean) removes empty strings from array
		return $(span).attr("djenius_ann_id").split(",").filter(x => x.trim()).filter(Boolean);
	}
	
	function getRelatedSpans(span)
	{
		let span_ids = getNodeDjeniusIds(span);
		
		return $("[djenius_ann_id]").filter(function()
		{
			let node_ids = getNodeDjeniusIds(this);
			
			for (let id of span_ids)
			{
				if (node_ids.includes(id))
					return true;
			}
			
			return false;
		}).toArray();
	}
	
	function spanMouseEnterHandler(span, relSpans, spanIds)
	{
		if (span)
		{
			let closestAnchor = span.closest("a");
			$(closestAnchor).click(function(e)
			{
				e.preventDefault();
				
				defer(chooseAnchorOrAnnotation_Handler,
				{
					anchor: closestAnchor,
					span: span,
					spanIds: getNodeDjeniusIds(span),
					relSpans: getRelatedSpans(span)
				},
				function(result)
				{
					if (result)
					{
						showAnnotation(getAnnotationById(result));
					}
					else
					{
						$(closestAnchor).off("click");
						closestAnchor.click();
					}
				},
				function(reason)
				{
					let errStr = "Choice failed.\n" + 
					"defer(chooseAnchorOrAnnotation_Handler, ...)";
					
					if (isValidString(reason))
						errStr += ":\n" + reason;
					
					console.error(errStr);
				});
			});
		}
		
		relSpans = relSpans ? relSpans : getRelatedSpans(span);
		spanIds = spanIds ? spanIds : getNodeDjeniusIds(span);
		
		let fraction = 0.90 / spanIds.length;
		
		$(relSpans).each(function()
		{
			let commonIds = getNodeDjeniusIds(this).filter(x => spanIds.includes(x));
			let alpha = 0.10 + commonIds.length * fraction;
			let color = getCssColor(activeColor, alpha);
			
			$(this).css("backgroundColor", color);
			$(this).css("box-shadow", "0 -1px 0 " + color + ", 0 1px 0 " + color);
			//$(this).css("box-shadow", "0 1px 0 " + color);
		});
	}
	
	function spanMouseLeaveHandler(span, relSpans)
	{
		if (span)
		{
			let closestAnchor = span.closest("a");
			$(closestAnchor).off("click");
		}
		
		relSpans = relSpans ? relSpans : getRelatedSpans(span);
		let fraction = 0.90 / annotationsCollection.length;
		
		$(relSpans).each(function()
		{
			let alpha = 0.10 + getNodeDjeniusIds(this).length * fraction;
			let color = getCssColor(idleColor, alpha);
			$(this).css("backgroundColor", color);
			$(this).css("box-shadow", "0 -1px 0 " + color + ", 0 1px 0 " + color);
			//$(this).css("box-shadow", "0 1px 0 " + color);
		});
	}
	
	function spanClickHandler(span)
	{
		let selArray = getSelectionRanges();
		if (selArray && selArray.length && !selArray[0].collapsed)
		{
			// user selection has both ends inside span, let's not trigger click event
			return;
		}
		
		let spanIds = getNodeDjeniusIds(span);
		
		if (!spanIds.length)
		{
			//error
			// ...
		}
		else if (spanIds.length == 1)
		{
			showAnnotation(/*test*/getAnnotationById(spanIds[0])/**/);
		}
		else
		{
			let relSpans = getRelatedSpans(span);
			
			defer(chooseAnnotation_Handler,
			{
				spanIds: spanIds,
				relSpans: relSpans
			},
			function(result)
			{
				showAnnotation(getAnnotationById(result));
			},
			function(reason)
			{
				let errStr = "Choice failed.\n" + 
				"defer(chooseAnnotation_Handler, ...)";
				
				if (isValidString(reason))
					errStr += ":\n" + reason;
				
				console.error(errStr);
			});
		}
	}
	
	function getRangesDifference(extRange, intRange)
	{
		let beforeRange = document.createRange();
		beforeRange.setStart(extRange.startContainer, extRange.startOffset);
		beforeRange.setEnd(intRange.startContainer, intRange.startOffset);
		
		let afterRange = document.createRange();
		afterRange.setStart(intRange.endContainer, intRange.endOffset);
		afterRange.setEnd(extRange.endContainer, extRange.endOffset);
		
		return [beforeRange, afterRange];
	}
	
	function createSpan(range, id)
	{
		let newSpan = document.createElement("span");
		$(newSpan).attr("djenius_ann_id", id);
		
		$(newSpan).hover
		(
			function()
			{
				spanMouseEnterHandler(newSpan);
			},
			function()
			{
				spanMouseLeaveHandler(newSpan);
			}
		);
		
		$(newSpan).click(function()
		{
			spanClickHandler(newSpan);
		});
		
		spansCollection.push(newSpan);
		range.surroundContents(newSpan);
		
		$(newSpan).trigger("mouseleave");
		
		return newSpan;
	}
	
	function highlightIdRanges(idRanges)
	{
		let spanIdRanges = [];
		
		for (let idRange of idRanges)
		{
			let nonIntRange = true;
			
			for (let spanIdRange of spanIdRanges)
			{
				let intRange = getIntersectionRange(idRange, spanIdRange);
				if (intRange)
				{
					// internal diff //
					
					let diffRanges = getRangesDifference(spanIdRange, intRange);
					spanIdRanges.removeAt(spanIdRanges.indexOf(spanIdRange));
					
					for (let diffRange of diffRanges)
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
					
					for (let diffRange of diffRanges)
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
		
		for (let spanIdRange of spanIdRanges)
		{
			let needFix = null;
			
			for (let compRange of spanIdRanges)
			{
				if (compRange.compareBoundaryPoints(Range.END_TO_START, spanIdRange))
					continue;
				
				needFix = compRange;
				break;	//there sould be only one
			}
			
			let newSpan = createSpan(spanIdRange, spanIdRange.id);
			
			if (needFix)
			{
				needFix.setStartAfter(newSpan);
			}
		}
	}
	
	function highlightAnnotations(annotations)
	{
		removeHighlightings();
		
		let idRanges = [];
		for (let annotation of annotations)
		{
			for (let range of getNativeRanges(annotation.ranges))
			{
				range.id = String(annotation.id);
				idRanges.push(range);
			}
		}
		
		highlightIdRanges(idRanges);
	}
	
	function highlightRanges(djRanges, id)
	{
		highlightAnnotations(
		[
			{
				id: id,
				ranges: djRanges
			}
		]);
	}
	
	//¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Annotations  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//_______________////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	let annotationsCollection = [];
	
	function getAnnotationById(id)
	{
		return annotationsCollection.find(x => x.id == id);
	}
	
	function getAnnotationsCount()
	{
		return annotationsCollection.length;
	}
	
	function updateAnnotationsCollection(collection)
	{
		annotationsCollection = collection;
		highlightAnnotations(annotationsCollection);
	}
	
	function askServerForInitialCollection()
	{
		defer(serverRequest_Handler,
		{
			request: ServerRequest.read
		},
		function(result)
		{
			updateAnnotationsCollection(result);
		},
		function(reason)
		{
			let errStr = "Initial collection retrieval failed.\n" + 
			"defer(serverRequest_Handler, ...)";
			
			if (isValidString(reason))
				errStr += ":\n" + reason;
			
			console.error(errStr);
		});
	}
	
	//¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  newAnnotation  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//_________________//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	function getSelectionRanges()
	{
		let userSel = window.getSelection();
		let selRanges = [];
		
		for (let i of iter(userSel.rangeCount))
		{
			selRanges.push(userSel.getRangeAt(i));
		}
		
		return selRanges;
	}
	
	function getDescendantTextNodes(node)
	{
		// do not optimize, the right order must be guaranteed
		
		let nodes = [];
		
		$(node).not("[djenius_ignore]").contents().each(function()
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
		let intRange = range_a.cloneRange();
		
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
		let pathArray = [];
		let $node = $(node);
		
		while (!$node.is(div))
		{
			pathArray.push($node.parent().contents().index($node));
			$node = $node.parent();
		}
		
		pathArray.reverse();
		return pathArray;
	}
	
	function getNewDjeniusRanges(intmdResult)
	{
		let intRanges = [];
		let newDjeniusRanges = [];
		
		let selRanges = getSelectionRanges();
		
		// Djenius divs not descendants of other Djenius divs
		$("[djenius_sel_id]").not("[djenius_sel_id] *").each(function(index, div)
		{
			div.normalize();
			
			let textNodes = getDescendantTextNodes(div);
			let djenius_sel_id = $(div).attr("djenius_sel_id");
			
			for (let range of selRanges)
			{
				for (let textNode of textNodes)
				{
					let textNodeRange = document.createRange();
					textNodeRange.selectNodeContents(textNode);
					
					let intRange = getIntersectionRange(range, textNodeRange);
					if (intRange && intRange.toString().trim())
					{
						if (intmdResult)
						{
							intRanges.push(intRange);
						}
						else
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
			}
		});
		
		if (intmdResult)
			return intRanges;
		
		return newDjeniusRanges;
	}
	
	function uuidv4()
	{
		return ([1e7]+-1e3+-4e3+-8e3+-1e11)
			.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	}
	
	function newAnnotation()
	{
		removeHighlightings();
		let newDjeniusRanges = getNewDjeniusRanges();
		
		if (newDjeniusRanges.length)
		{
			window.getSelection().removeAllRanges(); //maybe save it if it fails to load the new ranges to server
			highlightRanges(newDjeniusRanges, /*random id*/ "0");
			$(spansCollection[0]).trigger("mouseenter");
			
			defer(getAnnotationProperties_Handler, null, function(properties)
			{
				if (properties)
				{
					let newDjeniusAnnotation =
					{
						id: uuidv4(),
						ranges: newDjeniusRanges,
						properties: properties
					};
					
					defer(serverRequest_Handler,
					{
						request: ServerRequest.create,
						data: newDjeniusAnnotation
					},
					function(result)
					{
						annotationsCollection = result;
					},
					function(reason)
					{
						let errStr = "defer(serverRequest_Handler, ...)";
						
						if (isValidString(reason))
							errStr += ":\n" + reason;
						
						throw errStr;
					},
					function()
					{
						highlightAnnotations(annotationsCollection);
						//console.log(annotationsCollection);
					});
				}
				else
				{
					throw "resolve(...) argument is null or undefined";
				}
			},
			function(reason)
			{
				let errStr = "Annotation failed.\n" + 
				"defer(getAnnotationProperties_Handler, ...)";
				
				if (isValidString(reason))
					errStr += ":\n" + reason;
				
				console.error(errStr);
				
				
				highlightAnnotations(annotationsCollection);
				console.log(annotationsCollection);
			});
		}
		else
		{
			highlightAnnotations(annotationsCollection);
		}
	}
})();
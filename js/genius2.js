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

//getpathfunction

function download(text, name, type)
{
    var a = document.body.appendChild(document.createElement("a"));
    a.href = "data:text/plain;base64," + btoa(JSON.stringify(text));
    a.download = name;
    a.click();
}

//incorporate this function into confirm comment function
function pathTest(div, range)
{
	var pathElements = [];
	var current = $(range.startContainer);
	
	while (!current.is(div))
	{
		pathElements.push(current);
		current = current.parent();
	}
	
	pathElements.reverse();
	
	for (var elem of pathElements)
	{
		
	}
	
	//download({data:newRanges.toString()}, 'test.txt', 'text/plain');
}

var geniusClass = ".genius_sel";

$(document).ready(function()
{
	$("#genius").click(function(event)
	{
		var userSel = new UserSelection();
		var newRanges = [];
		
		// divs of class genius_sel not descendant of other divs of same class
		$(geniusClass).not(geniusClass + " *").each(function(index, div)
		{
			var divRange = document.createRange();
			divRange.selectNodeContents(div);
			
			// array of ranges intersecting with div
			var intRangeArray = userSel.intersectsNode(div);
			
			for (var intRange of intRangeArray)
			{
				var newRange = intRange.cloneRange();
				
				if (!($(div).hasDescendant(intRange.startContainer)))
				{
					newRange.setStart(div, divRange.startOffset);
				}
				
				if (!($(div).hasDescendant(intRange.endContainer)))
				{
					newRange.setEnd(div, divRange.endOffset);
				}
				
				//check selezione (se lunghezza 0 ecc.)
				if (!newRange.collapsed)
				{
					newRanges.push(newRange);
					console.log(newRange);
					
					pathTest(div, intRange);
				}
			}
		});
		
		// ...
	});
	
	$("#search").val("we");
	submitQuery();
});
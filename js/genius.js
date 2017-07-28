function range(n)
{
	var a = [];
	for (var i = 0; i < n; i++)
		a[i] = i;
	return a;
}

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
		if ($(node).hasClass
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

function rangeCheck(range)
{
	var node = range.startContainer;
	while (node && !$(node).hasClass("genius_sel"))
	{
		node = node.parentElement;
	}
}

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
			ranges.push(rangeCheck(sel.getRangeAt(i)));
		}
		
		/*TOREMOVE
		for (var i of range)
		{
			// if startContainer isnt genius_sel shift selection start
			// if endContainer isnt genius_sel shift selection end
			// sarebbe meglio farsi un vettore di elementi genius_sel e scremare da li
			
			if (!$(range.commonAncestorContainer).hasClass("genius_sel"))
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
		while (nextNode && !$(nextNode).hasClass("genius_sel"))
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
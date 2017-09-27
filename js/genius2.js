// Author: Mateusz W //
(function ()
{
	function UserRange(win)
	{
		this.win = win || window;
		this.doc = this.win.document;
		this.userRange = this.createUserRange();
	}
	
	var NonIEPrototype =
	{
		constructor: UserRange,
		
		createUserRange: function()
		{
			var selection = this.win.getSelection();
			return selection.rangeCount ? selection.getRangeAt(0) : this.doc.createRange();
		},
		
		overlapsNode: function(node)
		{
			return this.intersectsNode(node);
		},
		
		intersectsNode: function(node)
		{
			// this method is implemented in Firefox with Gecko before 1.9 and other non-IE browsers
			if (this.userRange.intersectsNode)
			{
				return this.userRange.intersectsNode(node);
			}
			
			return this.intersectsRange(this.createRangeWithNode(node));
		},
		
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
			return rangeWithNode;
		},
		
		intersectsRange: function(range)
		{
			return this.userRange.compareBoundaryPoints(Range.END_TO_START, range) === -1 &&
			this.userRange.compareBoundaryPoints(Range.START_TO_END, range) === 1;
		}
	};
	
	var IEPrototype =
	{
		constructor: UserRange,
		
		createUserRange: function()
		{
			return this.doc.selection.createRange();
		},
		
		overlapsNode: function(node)
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
	
	UserRange.prototype = window.getSelection ? NonIEPrototype : IEPrototype;
	window.UserRange = UserRange;
}());
///////////////////////


function range(n)
{
	var a = [];
	for (var i = 0; i < n; i++)
		a[i] = i;
	return a;
}

var geniusClass = "genius_sel";

$(document).ready(function()
{
	$("#genius").click(function(event)
	{
		var userRange = new UserRange();
		
		var sel = window.getSelection();
		var ranges = [];
		
		for (var i in range(sel.rangeCount))
		{
			ranges.push(sel.getRangeAt(i));
		}
		
		/*
		$.each(ranges, function(index, range) // non serve sto ciclo
		{
			$(range.commonAncestorContainer).find("." + geniusClass).each(function(index, current)
			{
				if (userRange.overlapsNode(current))
					console.log(index);
			});
		});
		
		// se la selezione è interna ad un solo div di classe genius_sel non stampa niente...
		// perchè faccio la ricerca dei div figli del common ancestor, nel caso la selezione
		// ricada in un unico div di quel tipo c'è caso che consideri un <p> come il common
		// ancestor, ad esempio... devo trattarlo come caso particolare... ma come?
		// forse mi converrebbe considerare sempre tutti i div che sono genius_sel, tanto non
		// saranno mai troppi...
		*/
		
			$("." + geniusClass).each(function(index, current)
			{
				if (userRange.overlapsNode(current))
					console.log(index);
			});
	});
	
	$("#search").val("we");
	submitQuery();
});
// Author: Mateusz W //

// TODO: selezionare TUTTI i range della selection (per ora consedera solo il primo)

(function()
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

var geniusClass = ".genius_sel";

$(document).ready(function()
{	
	$("#genius").click(function(event)
	{		
		//old solution
		/*
		var sel = window.getSelection();
		var ranges = [];
		
		for (var i in range(sel.rangeCount))
		{
			ranges.push(sel.getRangeAt(i));
		}
		*/
		
		var userRange = new UserRange();
		
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
		
		var newRanges = [];
		
		// divs of class genius_sel not descendant of other divs of same class
		$(geniusClass).not(geniusClass + " *").each(function(index, current)
		{
			if (userRange.intersectsNode(current))
			{
				console.log(index);
				
				var newRange = userRange.userRange.cloneRange();
				newRange.selectNode(current);
				
				//se current ha come discendente startContainer calcola l'inizio
				//if ($.contains(current[0], userRange.userRange.startContainer))
				if ($(current).has(userRange.userRange.startContainer).length)
				{
					newRange.setStart(userRange.userRange.startContainer, userRange.userRange.startOffset);
				}
				
				//se current ha come discendente endContainer calcola la fine
				//if ($.contains(current[0], userRange.userRange.endContainer))
				if ($(current).has(userRange.userRange.endContainer).length)
				{
					newRange.setEnd(userRange.userRange.endContainer, userRange.userRange.endOffset);
				}
				
				//check selezione (se lunghezza 0 ecc.) (proprietà collapsed?)
				if (!newRange.collapsed)
				{
					newRanges.push(newRange);
					console.log(newRange);
				}
				
				//selezione rispetto al div genius_sel o il p al suo interno?
				//eh boh, per wiki mi sa che la metti nel container
			}
		});
	});
	
	$("#search").val("we");
	submitQuery();
});
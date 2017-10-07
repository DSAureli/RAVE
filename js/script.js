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

String.prototype.replaceAll = function(search, replacement) 
{
    var target = this;
    return target.split(search).join(replacement);
};

function respCheck()
{
	// Sometimes CSS media queries and JQuery window.width work differently,
	// so we better check for CSS properties instead of window.width
	
	if ($("#column_wiki").css("order") == "1" )
	{
		$("#header_login").detach().insertAfter("#header_home");
		$("#title").removeClass("left floated").addClass("center aligned");
		$("#dropdown_sections").css("float", "none").css("display", "flex");
	}
	else
	{
		$("#header_login").detach().insertAfter("#header_input");
		$("#title").removeClass("center aligned").addClass("left floated");
		$("#dropdown_sections").css("display", "block").css("float", "right");
	}
}

var query = null;

var firstCall = true;	// necessary in order to avoid onChange activation
var oldDrop;

function historyNav(index, section)
{
	updateContent(index, section);
	var url = '?' + section;
	history.pushState({old:oldDrop, word:query, val:index, text:section}, null, url);
	var x = history.length;
}

function updateContent(index, section)
{
	$("#column_wiki").dimmer("show");
	$("#column_wiki .loader").removeClass("disabled");
	$("#column_crossref").dimmer("show");
	$("#column_crossref .loader").removeClass("disabled");
	
	/* WIKIPEDIA */
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			page: query,
			section: index,
			prop: "text",
			format: "json"
		},
		dataType: "jsonp",
		success: function(apiResult)
		{
			$("#content_wiki").html(apiResult.parse.text["*"]);
			$("#content_wiki").find("a").each(function(index, elem)
			{
				elem.href = "//en.wikipedia.org" + elem.pathname;
			});
			$("#content_wiki").find("img").each(function(index, elem)
			{
				// ...
			});
			
		},
		error: function(error)
		{
			console.log(error);
			$("#content_wiki").html(error);
		},
		complete: function()
		{
			$("#column_wiki").dimmer("hide");
			$("#column_wiki .loader").addClass("disabled");
			$("#content_wiki img.thumbimage").attr("class", "ui medium rounded image");
		}
	});
	
	/* CROSSREF */
	$.ajax(
	{
		url: "https://api.crossref.org/works?query="+ query.split(" ").join("+") + "+" + section.split(" ").join("+") + "&rows=10&sort=score",
		dataType: "text",
		success: function(cross)
		{
			cross = $.parseJSON(cross);
			$("#content_crossref").html("");
			
			$.each(cross.message.items, (i, item) =>
			{
				if (item.issue != "0")
				{
					$("#content_crossref").append("<div class='ui segment'><p>Title: {0}</br>Publisher: {1}</br> Type: {2}</br> <a href='{3}'>Get this content</a></p></div>".format(item.title[0], item.publisher, item.type, item.URL));
				}
			});
		},
		error: function(error)
		{
			console.log(error);
			$("#content_crossref").html(error);
		},
		complete: function()
		{
			$("#column_crossref").dimmer("hide");
			$("#column_crossref .loader").addClass("disabled");
		}
	});
}

function submitQuery()
{
	var oldQuery = query;
	query = $("#search").val();
	$("#title").text(query);
	if(oldQuery != query)
		oldDrop = $("#menu_sections").html();
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			prop: "sections",
			page: query,
			format: "json"
		},
		dataType: "jsonp",
		success: function(apiResult)
		{	
			$("#menu_sections").empty();	//erase old sections from dropdown for each new search
				
			$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(0, "Introduction"));	// add abstract section as "introduction"
			
			$.each(apiResult.parse.sections, (i, section) =>
			{
				if (section.line != "References" && section.line != "External links" && section.toclevel==1)
					$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(section.index, section.line));
			});
			
		},
		error: outputError(),
		complete: function()
		{
			$("#dropdown_sections").dropdown(
			{
				action: "activate",
				onChange:
				function(value, text, $choice)
				{
					historyNav(value,text);
					firstCall = false;
				}
			});
			
			$("#dropdown_sections").find("[data-value=0]").trigger('click');
			/* A fake click is necessary to select the correct element of dropdown on each new search.
			   We need this trick because "set selected" and "set value" don't help with the firing of onChange. */
			
			var val = $("#dropdown_sections").dropdown("get value");				
			var text = $("#dropdown_sections").dropdown("get text");
			if(firstCall)
				historyNav(val, text);
			firstCall = true;
		}
	});
}


$(document).ready(function()
{
	$("body").on("dragstart", false);
	
	respCheck();
	$(window).resize(respCheck);
	

	$("#search").keyup(function(event)
	{
		if (event.which == 13)
		{
			submitQuery();
		}
	});
	
	// Also bind the search icon anchor to submitQuery
	
	$("#searchButton").click(function(event)
	{
		event.preventDefault();	// prevent link behavior
		submitQuery();
	});
	
	window.addEventListener('popstate', function(e)
	{
		var index = e.state.val;
		var section = e.state.text;
		query = e.state.word;
		$("#title").text(query);

		updateContent(index,section);
		
		$("#menu_sections").empty();
		$("#menu_sections").append(oldDrop);
		$("#dropdown_sections").dropdown("set text", section);		
	});
});

function outputError(errorMessage)
{
	console.log(errorMessage);
}
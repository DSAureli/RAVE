// TODO: fix the duplication of history entry on the refresh.

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

function virtualClickOnDropElement(value)
{
	$("#dropdown_sections").find("[data-value=" + value + "]").trigger('click');
}

var query = null;
var oldQuery;

var firstCall = true;	// necessary in order to avoid onChange activation
var oldDrop;

function historyNav(index, section)
{
	updateContent(index, section);
	oldDrop = $("#menu_sections").html();
	var url = '?' + query + '&' + index + '&' + section;
	history.pushState({old:oldDrop, word:query, val:index, text:section}, null, url);
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
			$("#content_wiki").find("a").each(function()
			{
				this.href = "//en.wikipedia.org" + this.pathname;
			});
			$("#content_wiki").find("img").each(function()
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
					var newDiv = $("<div></div>").addClass("ui segment").append
					(
						$("<p></p>").html("Title: {0}</br>Publisher: {1}</br>Type: {2}</br>".format(item.title[0], item.publisher, item.type)).append
						(
							$("<a></a>").attr("href", item.URL).text("Get this content")
						)
					);
					
					Djenius.setAnnotatable(newDiv, item.DOI);
					$("#content_crossref").append(newDiv);
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

function submitQuery(refresh)
{
	
	var refresh;
	var urlSections = window.location.href;
	var urlCheck = urlSections.indexOf('?')
	if ( refresh && urlCheck>-1 ) // in case of refresh or bookmark
	{
		urlSections = urlSections.split("?");
		urlSections = urlSections[1].split("&");
		query = decodeURIComponent(urlSections[0]);
		refresh = true;
	}
	else if(refresh && urlCheck==-1 )
		return;
	else
	{
		query = $("#search").val();
		$.trim(query);
		if (/\S/.test(query))			// avoid empty search
			refresh = false;
		else 
		{
			alert("Please insert at least one keyword");
			return;
		}
	}

	$("#title").text(query);
	
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
			
			if(refresh == false)
			{
				virtualClickOnDropElement('0');
				/* A fake click is necessary to select the correct element of dropdown on each new search.
				   We need this trick because "set selected" and "set value" don't help with the firing of onChange. */

				var val = $("#dropdown_sections").dropdown("get value");				
				var text = $("#dropdown_sections").dropdown("get text");
				if(firstCall)
					historyNav(val, text);
				firstCall = true;
			}
			// Add the content in case of refresh or bookmark
			else	
			{
				var index = urlSections[1];
				var section = decodeURIComponent(urlSections[2]);
				virtualClickOnDropElement(index);
				updateContent(urlSections[1], section);
			}
			oldDrop = $("#menu_sections").html();
			
		}
	});
}


$(document).ready(function()
{
	$("body").on("dragstart", false);
	$("#modal_login").modal({duration: 300, transition: "fade down"});
	
	respCheck();
	$(window).resize(respCheck);

	submitQuery(true);	// in case of refresh or bookmark
	
	$("#search").keyup(function(event)
	{
		if (event.which == 13)
		{
			submitQuery(false);
		}
	});
	
	// Also bind the search icon anchor to submitQuery
	
	$("#searchButton").click(function(event)
	{
		event.preventDefault();	// prevent link behavior
		submitQuery(false);
	});
	
	$("#djenius_button").click(function()
	{
		//set djenius_column loading animation on
		// ...
		
		Djenius.newAnnotation();
		
		//set djenius_column loading animation off
		// ...
	});
	
	// Also bind the search icon anchor to submitQuery
	// ...
	
	window.addEventListener('popstate', function(e)
	{
		var index = e.state.val;
		var section = e.state.text;
		query = e.state.word;
		$("#title").text(query);

		updateContent(index,section);
		
		$("#menu_sections").empty();
		$("#menu_sections").append(e.state.old);
		$("#dropdown_sections").dropdown("set text", section);
		if(section!="Introduction")
			virtualClickOnDropElement(index);
	});
});

function outputError(errorMessage)
{
	console.log(errorMessage);
}
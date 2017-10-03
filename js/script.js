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

var query;

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
					$("#content_crossref").append("<div class='ui segment genius_sel'><p>Title: {0}</br>Publisher: {1}</br> Type: {2}</br> <a href='{3}'>Get this content</a></p></div>".format(item.title[0], item.publisher, item.type, item.URL));
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
	query = $("#search").val();
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
				if (section.line != "References" && section.line != "External links")
					$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(section.index, section.line));
			});
			
			// "Abstract" section (ie the one before the "Contents" table) missing!
		},
		error: outputError(),
		complete: function()
		{
			$("#dropdown_sections").dropdown(
			{
				action: "activate",
				onChange: updateContent
			});
			
			$("#dropdown_sections").dropdown("set selected", 0);	// introduction is the default selected section
			var val = $("#dropdown_sections").dropdown("get value");
			var text = $("#dropdown_sections").dropdown("get text");
			updateContent(val, text);
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
			submitQuery();
	});
	
	$("#searchButton").click(function(event)
	{
		event.preventDefault();	// prevent link behavior
		submitQuery();
	});
	
	// Also bind the search icon anchor to submitQuery
});

function outputError(errorMessage)
{
	console.log(errorMessage);
}
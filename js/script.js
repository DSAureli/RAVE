String.prototype.format = function()
{
	var content = this;
	for (var i=0; i < arguments.length; i++)
	{
		var replacement = '{' + i + '}';
		content = content.replace(replacement, arguments[i]);
	}
	return content;
};

function updateContent(index, title)
{
	$("#column_wiki").dimmer("show");
	$("#column_crossref").dimmer("show");
	
	/* WIKIPEDIA */
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			page: "Steins;Gate (anime)",
			section: index,
			prop: "text",
			format: "json"
		},
		dataType: "jsonp",
		success: function(apiResult)
		{
			$("#content_wiki").html(apiResult.parse.text["*"]);
			
			$("#content_wiki").find('a[href^="/wiki/"]').prop("href", function(index, old)
			{
				//return old.split("file://").join("https://en.wikipedia.org");
				return old.replace("file://", "https://en.wikipedia.org");
			});
			
			$("#content_wiki").find('img[src^="//"]').prop("src", function(index, old)
			{
				//return old.split("file://").join("https://upload.wikimedia.org");
				return old.replace("file://", "https://upload.wikimedia.org");
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
		}
	});
	
	/* CROSSREF */
	$.ajax(
	{
		url: "https://api.crossref.org/works?query=steins+gate+" + title.split(" ").join("+") + "&rows=10&sort=score",
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
		}
	});
}

$(document).ready(function()
{
	$("body").on("dragstart", false);
	
	$("#dropdown_sections").dropdown(
	{
		onChange: updateContent
	});
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			prop: "sections",
			page: "Steins;Gate (anime)",
			format: "json"
		},
		dataType: "jsonp",
		success: function(apiResult)
		{
			$.each(apiResult.parse.sections, (i, section) =>
			{
				if (section.line != "References" && section.line != "External links")
					$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(section.index, section.line));
			});
		},
		error: outputError()
	});
	
	updateContent(0, "Summary");
});

function outputError(errorMessage)
{
	console.log(errorMessage);
}
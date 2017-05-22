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
			$("#column_wiki").html(apiResult.parse.text["*"]);
			
			$("#column_wiki").find('a[href^="/wiki/"]').prop("href", function(index, old)
			{
				return old.split("file://").join("https://en.wikipedia.org");
			});
			
			$("#column_wiki").find('img[src^="//"]').prop("src", function(index, old)
			{
				return old.split("file://").join("https://upload.wikimedia.org/");
			});
			
			/*
			$("#column_wiki").html(apiResult.parse.text["*"]
				.split('<a href="/w').join('<a href="https://en.wikipedia.org/w')
				.split('src="//').join('src="https://'));
			*/
		},
		error: outputError()
	});
	
	/* CROSSREF */
	$.ajax(
	{
		url: "https://api.crossref.org/works?query=steins+gate+" + title.split(" ").join("+") + "&rows=10&sort=score",
		dataType: "text",
		success: function(cross)
		{
			cross = $.parseJSON(cross);
			$("#column_crossref").html("");
			
			$.each(cross.message.items, (i, item) =>
			{
				if (item.issue != "0")
				{
					$("#column_crossref").append("<div class='ui tall stacked segment'><p>Title: {0}</br>Publisher: {1}</br> Type: {2}</br> <a href='{3}'>Get this content</a></p></div>".format(item.title[0], item.publisher, item.type, item.URL));
				}
			});
		},
		error: outputError()
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
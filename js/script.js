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

function retrieveSection(index, title)
{
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
			$("#content").html(apiResult.parse.text["*"]
				.split('<a href="/w').join('<a href="https://en.wikipedia.org/w')
				.split('src="//').join('src="https://'));
			console.log(index, title);
		},
		error: outputError()
	});
}

$(document).ready(function()
{
	$("body").on("dragstart", false);
	
	$("#dropdown_sections").dropdown(
	{
		onChange: retrieveSection
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
			/*$("#content").html("");*/
			
			$.each(apiResult.parse.sections, (i, section) =>
			{
				if (section.line != "References" && section.line != "External links")
					$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(section.index, section.line));
				
				/*
				var div = $('<div class="ui styled accordion"></div>').appendTo("#content");
				
				$.ajax(
				{
					url: "http://en.wikipedia.org/w/api.php",
					data:
					{
						action: "parse",
						page: "Steins;Gate (anime)",
						section: section.index,
						prop: "text",
						format: "json"
					},
					dataType: "jsonp",
					success: function(apiResult)
					{
						div.append(
							'<div class="title"><i class="dropdown icon"></i>{0} {1}</div><div class="content"><p>{2}</p></div>'
							.format(section.index, section.line, apiResult.parse.text["*"]));
						$('.ui.accordion').accordion();
					},
					error: outputError()
				});
                
                $.ajax(
                {
                    url: "https://api.crossref.org/works?query=stein's+gate+" + section.line ,
                    dataType: "text",
                    success: function(cross)
					{
                        cross = $.parseJSON(cross);
                        $("#content").append(
							'<div class="ui styled accordion"><div class="title"><i class="dropdown icon"></i>{0} {1}</div><div class="content"><p>{2}</p></div></div>'
							.format(section.index, cross.message.items[0].title[0], cross.message.items[0].publisher));
						$('.ui.accordion').accordion();
					},
					error: outputError()
                });
				*/
			});
		},
		error: outputError()
	});
	
	retrieveSection(0, "Summary");
});

function outputError(errorMessage)
{
	$("#content").html(errorMessage);
}
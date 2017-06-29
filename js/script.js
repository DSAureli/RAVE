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

function respHeader()
{
	// Sometimes CSS media queries and JQuery window.width work differently,
	// so we better check for CSS properties instead of window.width
	
	if ($("#column_wiki").css("order") == "1" )
	{
		$("#header_login").detach().insertAfter("#header_home");
	}
	else
	{
		$("#header_login").detach().insertAfter("#header_input");
	}
}

function updateContent(index, title, sfor)
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
			page: sfor,
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
		url: "https://api.crossref.org/works?query="+ sfor.split(" ").join("+") + "+" + title.split(" ").join("+") + "&rows=10&sort=score",
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

$(document).ready(function()
{
	$("body").on("dragstart", false);
	
	var sfor;
	
	$("#dropdown_sections").dropdown(
	{
		//onChange: updateContent
		action: function(text, value)
		{
			updateContent(value, text, sfor);
			action: 'activate'
		}
	});
	
	respHeader();
	$(window).resize(respHeader);
	
	$("#search").keyup(function(event)
	{
		if(event.which == 13)
		{
		
			sfor = $("#search").val();
			var firstSec;
			$("#title").text(sfor);
			
			$.when(   // necessary due to the weird behaviour of ajax, which is executed after the other function call below
				$.ajax(
				{
					url: "http://en.wikipedia.org/w/api.php",
					data:
					{
						action: "parse",
						prop: "sections",
						page: sfor,
						format: "json"
					},
					dataType: "jsonp",
					success: function(apiResult)
					{
						$.each(apiResult.parse.sections, (i, section) =>
						{
							if(i==0)
								firstSec = section.line;
							if (section.line != "References" && section.line != "External links")
								$("#menu_sections").append('<div class="item" data-value="{0}">{1}</div>'.format(section.index, section.line));
						});
						
						$("#defaultDrop").text(firstSec);
					},
					error: outputError()
				})
			).then(
				function()
				{
					updateContent(0, firstSec, sfor);
				});	
		}
	});
	
	//updateContent(0, "Summary");
});

function outputError(errorMessage)
{
	console.log(errorMessage);
}
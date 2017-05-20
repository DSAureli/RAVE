$(document).ready(function()
{
	$('body').on('dragstart', false);
	
	
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
			$("#content").html("");
			$.each(apiResult.parse.sections, (i, section) =>
			{
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
						$("#content").append(
							'<div class="ui styled accordion"><div class="title"><i class="dropdown icon"></i>' + section.index + " " + section.line +
							'</div><div class="content"><p>' + apiResult.parse.text["*"] + '</p></div></div>');
						$('.ui.accordion').accordion();
					},
					error: outputError()
				});
			});
		},
		error: outputError()
	});
});

function outputError(errorMessage)
{
	$("#content").html(errorMessage);
}
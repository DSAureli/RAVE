$(document).ready(function()
{
	$("#btn_search").click(function()
	{
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				format: "json",
				action: "query",
				list: "search",
				srsearch: "Steins;Gate",
			},
			dataType: "jsonp",
			success: function(apiResult)
			{
				$("#content").html("");
				$.each(apiResult.query.search, (i, record) =>
				{
					$("#content").append("<p>" + i + " : " + record.title + "</p>");
				});
			},
			error: outputError()
		});
	});

	$("#btn_load").click(function()
	{
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				format: "json",
				action: "parse",
				page: "Steins;Gate (anime)",
				section: "1"
			},
			dataType: "jsonp",
			success: function(apiResult)
			{
				$("#content").html(apiResult.parse.text["*"].replace(new RegExp('src=\"', 'g'), 'src=\"https:'));
			},
			error: outputError()
		});
	});
	
	$("#btn_extract").click(function()
	{
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				action: "query",
				prop: "extracts",
				format: "json",
				titles: "Steins;Gate (anime)"
			},
			dataType: "jsonp",
			success: function(apiResult)
			{
				$("#content").html(apiResult.query.pages[Object.keys(apiResult.query.pages)[0]].extract);
			},
			error: outputError()
		});
	});
});

function outputError(errorMessage)
{
	$("#content").html(errorMessage);
}
function pushHistoryState(page, section)
{
	//let path = "/";
	let path = "./index.html";
	//workaround for local development
	//first row should be ok for server deployment
	
	if (isValidString(page))
	{
		//path += "search?page=" + page;
		path += "?page=" + page;
		//same reason
		
		if (isValidString(section))
			path += "&section=" + section;
	}
	
	history.pushState(null, null, path);
}


//function loadhomepage
// ...


function updateContent(page, sectionIndex, sectionName)
{
	/* WIKIPEDIA */
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			page: page,
			section: sectionIndex,
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
			$("#content_wiki img.thumbimage").attr("class", "ui medium rounded image");				// ?
		}
	});
	
	/* CROSSREF */
	$.ajax(
	{
		url: "https://api.crossref.org/works?query="+ page.split(" ").join("+") + "+" + sectionName.split(" ").join("+") + "&rows=10&sort=score",
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


function getDropdownValues(sections, selected)
{
	let values = [];
	
	sections.unshift(
	{
		index: "0",
		line: "Abstract",
		toclevel: 1
	});
	
	for (section of sections)
	{
		if (section.line != "References" && section.line != "External links" && section.toclevel == 1)
		{
			values.push(
			{
				value: section.index,
				name: section.line
			});
		}
	}
	
	if (selected)
	{
		let select = values.filter(value => value.value == selected);
		
		if (select.length)
		{
			select[0].selected = true;
		}
		else
		{
			throw "section not found";
		}
	}
	else
	{
		values[0].selected = true;
	}
	
	return values;
}


function loadPage(page, section)
{
	// Switch loading visuals on
	
	$("#column_wiki").dimmer("show");
	$("#column_wiki .loader").removeClass("disabled");
	$("#column_crossref").dimmer("show");
	$("#column_crossref .loader").removeClass("disabled");
	
	$("#dropdown_sections").dropdown({action: "nothing"});
	$("#dropdown_sections").dropdown("change values");
	$("#dropdown_sections").addClass("disabled");
	
	// Load page
	
	if (isValidString(page))
	{
		$("#dropdown_sections").addClass("loading");
		
		// Populate dropdown
		
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				action: "parse",
				prop: "sections",
				page: page,
				format: "json"
			},
			dataType: "jsonp",
			success: function(result, status, xhr)
			{
				let values = getDropdownValues(result.parse.sections, section);
				let firstTime = true;
				
				$("#dropdown_sections").dropdown(
				{
					action: "activate",
					values: values,
					onChange: function(value, text, $choice)
					{
						if (firstTime)
						{
							firstTime = false;
						}
						else
						{
							pushHistoryState(page, value.toString());
							updateContent(page, value, text);
						}
					}
				});
				
				let sectionIndex = values.map(x => x.selected).indexOf(true);
				updateContent(page, sectionIndex, values[sectionIndex].name);
				
				$("#dropdown_sections").removeClass("disabled");
			},
			error: function(xhr, status, error)
			{
				console.error(error);
			},
			complete: function(xhr, status)
			{
				$("#dropdown_sections").removeClass("loading");
			}
		});
	}
	else
	{
		//load homepage
		// ...
		
		//switch loading visuals off
		//inside ajax functions
		// ...
		
		
		$("#column_wiki").dimmer("hide");
		$("#column_wiki .loader").addClass("disabled");
		$("#column_crossref").dimmer("hide");
		$("#column_crossref .loader").addClass("disabled");
	}
}


function handleLoad(link, push)
{
	// Retrieve params from URL
	
	let params = new URLSearchParams(link.search);
	let page = params.get("page");
	let section = params.get("section");
	
	if (push)
	{
		pushHistoryState(page, section);
	}
	
	let title = "RAVE";
	let first = "RAVE";
	
	if (isValidString(page))
	{
		title = page + " | " + title;
		first = page;
	}
	
	document.title = title;
	$("#title").text(first);
	
	loadPage(page, section);
}


window.addEventListener("popstate", function(event)
{
	handleLoad(event.target.location, false);
});


function startSearch()
{
	let search = $("#search_bar").val();
	
	if (isValidString(search))
	{
		let link = $("<a>").attr("href", "?page=" + search)[0];
		handleLoad(link, true);
	}
	else
	{
		// ...
	}
}


function updateResponsiveness()
{
	// Sometimes CSS media queries and JQuery window.width work differently,
	// so we better check for CSS properties instead of window.width
	
	if ($("#column_wiki").css("order") == "1")
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


$(document).ready(function()
{
	// Init //
	
	$("body").on("dragstart", false);
	$("#modal_login").modal({duration: 300, transition: "fade down"});
	
	updateResponsiveness();
	$(window).resize(updateResponsiveness);
	
	$("#search_bar").keyup(function(event)
	{
		if (event.which == 13)
		{
			startSearch();
		}
	});
	
	$("#search_button").click(function(event)
	{
		event.preventDefault();
		startSearch()
	});
	
	$("#djenius_button").click(function()
	{
		//set djenius_column loading animation on
		// ...
		
		//Djenius.newAnnotation();
		
		//set djenius_column loading animation off
		// ...
	});
	
	// Load //
	
	handleLoad(window.location, false);
});










// TOMOVE
/*
let links = document.querySelectorAll("nav-bar > nav > a");
for (let link of links)
{
	link.addEventListener("click", function(event)
	{
		event.preventDefault();
		
		if (!this.classList.contains("active"))
		{
			handleLoad(link, true);
		}
	});
}
*/
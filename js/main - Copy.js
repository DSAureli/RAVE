window.rave = {};

// ...
//updateResponsiveness mettilo giù

function pushHistoryState(page, section, replace)
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
		{
			path += "&section=" + section;
		}
	}
	
	if (replace)
	{
		history.replaceState(null, null, path);
	}
	else
	{
		history.pushState(null, null, path);
	}
}


//function loadhomepage
// ...


function updateContent(/*...*/)
{
	// ...
	console.log("updateContent");
}


function getSections(sections, selected)
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
				let sections = getSections(result.parse.sections, section);
				let firstTime = true;
				
				$("#dropdown_sections").dropdown(
				{
					action: "activate",
					values: sections,
					onChange: function(value, text, $choice)
					{
						if (firstTime)
						{
							document.title = "{0} | {1} | RAVE".format(text, page);
							//prova anche a metterlo a inizio onChange
							
							if (window.rave.replaceState)
							{
								pushHistoryState(page, value.toString(), true);
								window.rave.replaceState = false;
							}
							
							firstTime = false;
						}
						else
						{
							pushHistoryState(page, value.toString(), false);
							document.title = "{0} | {1} | RAVE".format(text, page);
						}
						
						updateContent(/*...*/);
					}
				});
				
				$("#dropdown_sections").removeClass("disabled");
				updateContent(/*...*/);
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
		console.log("load homepage");
		
		//switch loading visuals off
		//inside ajax functions
		// ...
	}
}


function handleLoad(link, push)
{
	// Retrieve params from URL
	
	let params = new URLSearchParams(link.search);
	let page = params.get("page");
	let section = params.get("section");
	
	//I would put that here before loadPage
	//if it is the case, update the original template script as well
	if (push)
	{
		pushHistoryState(page, section, false);
	}
	
	window.rave.replaceState = false;
	let title = "RAVE";
	let first = "RAVE";
	
	if (isValidString(page))
	{
		title = page + " | " + title;
		first = page;
		
		if (!isValidString(section))
			window.rave.replaceState = true;
	}
	
	document.title = title;
	$("#title").text(first);
	
	loadPage(page, section);
}


window.addEventListener("popstate", function(event)
{
	console.log("popstate: " + event.target.location);
	handleLoad(event.target.location, false);
});


function startSearch()
{
	let search = $("#search").val();
	
	if (isValidString(search))
	{
		let link = $("<a>").attr("href", "?page=" + search)[0];
		handleLoad(link, true);
	}
	else
	{
		console.log("empty search yada yada");
	}
}


$(document).ready(function()
{
	// Init //
	
	$("body").on("dragstart", false);
	$("#modal_login").modal({duration: 300, transition: "fade down"});
	
	//updateResponsiveness(); //decomment this
	//$(window).resize(updateResponsiveness); //decomment this too
	
	$("#search").keyup(function(event)
	{
		if (event.which == 13)
		{
			startSearch();
		}
	});
	
	$("#searchButton").click(function(event)
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
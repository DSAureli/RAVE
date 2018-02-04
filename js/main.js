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
	$("#content_wiki_container .loader").removeClass("disabled");
	$("#content_wiki_container").dimmer("show");
	$("#column_crossref .loader").removeClass("disabled");
	$("#column_crossref").dimmer("show");
	
	/* WIKIPEDIA */
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			redirects: true,
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
			$("#content_wiki_container").dimmer("hide");
			$("#content_wiki_container .loader").addClass("disabled");
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
					
					//Djenius.setAnnotatable(newDiv, item.DOI);
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
	
	$("#main_dropdown").dropdown({action: "nothing"});
	$("#main_dropdown").dropdown("change values");
	$("#main_dropdown").addClass("disabled");
	
	// Load page
	
	if (isValidString(page))
	{
		$("#main_dropdown").addClass("loading");
		
		// Populate dropdown
		
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				action: "parse",
				page: page,
				redirects: true,
				prop: "sections",
				format: "json"
			},
			dataType: "jsonp",
			success: function(result, status, xhr)
			{
				let values = getDropdownValues(result.parse.sections, section);
				let firstTime = true;
				
				$("#main_dropdown").dropdown(
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
				
				$("#main_dropdown").removeClass("disabled");
			},
			error: function(xhr, status, error)
			{
				console.error(error);
			},
			complete: function(xhr, status)
			{
				$("#main_dropdown").removeClass("loading");
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
	$("#main_title").text(first);
	
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
	let resp_str = $("#resp_check").css("content").replaceAll("\"", "");
	// Edge always sees content as an empty string
	let resp_str_edge = $("#resp_check").css("flex-grow");
	
	if (resp_str == "Tablet" || resp_str == "Desktop" || resp_str_edge != "0")
	{
		window.device = 1;
		
		$("#header_input").detach().insertAfter("#header_home");
		$("#column_wiki").addClass("segment");
		
		$("#column_crossref").addClass("blurring");
		$("#content_wiki_container").addClass("blurring");
	}
	else
	{
		window.device = 0;
		
		$("#header_input").detach().insertAfter("#header_flex");
		$("#column_wiki").removeClass("segment");
		
		$("#column_crossref").removeClass("blurring");
		$("#content_wiki_container").removeClass("blurring");
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




// Polyfill for Edge

if (!window.URLSearchParams)
{
	window.URLSearchParams = class URLSearchParams
	{
		constructor(str)
		{
			this.str = str;
		}
		get(name)
		{
			var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(this.str);
			if (results == null)
				return null;
			return decodeURI(results[1]) || 0;
		}
	}
}




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
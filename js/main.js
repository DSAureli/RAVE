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



function loadHome()
{
	// ...
}



function handleImgClick()
{
	function first(obj)
	{
		for (let x in obj)
			return x;
	}
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "query",
			titles: $(this).attr("img-src"),
			prop: "imageinfo",
			iiprop: "url",
			format: "json"
		},
		dataType: "jsonp",
		success: function(result)
		{
			$("#image_modal img")[0].onload = function()
			{
				$("#image_modal").modal(
				{
					duration: 200,
					onShow: function()
					{
						$("#image_modal img").css("visibility", "visible");
					},
					onHidden : function()
					{
						$("#image_modal img").css("visibility", "hidden");
						$("#image_modal img")[0].src = "";
					}
				}).modal("show");
			};
			
			let pages = result.query.pages;
			let imageinfo = pages[first(pages)].imageinfo;
			
			$("#image_modal img")[0].src = imageinfo[first(imageinfo)].url;
		}
	});
}



function filterWiki(result)
{
	var html = $(result.parse.text["*"]);
	
	// "look it up in Wiktionary"
	$(html).find(".mbox-small").remove();
	// "needs additional citations"
	$(html).find(".ambox").remove();
	// template related
	$(html).find(".plainlinks.hlist.navbar").remove();
	// table of content
	$(html).find(".toc").remove();
	// vertical navbox
	$(html).find(".vertical-navbox").remove();
	// section headline
	$(html).find(".mw-headline").remove();
	// "for other uses"
	$(html).find(".hatnote.navigation-not-searchable").remove();
	// "infobox"
	$(html).find(".infobox").remove();
	// edit link beside section title
	$(html).find(".mw-editsection").remove();
	// sup numbers
	$(html).find(".reference").remove();
	// citation needed and similar
	$(html).find("sup.noprint").remove();
	// end page references
	$(html).find(".mw-references-wrap").remove();
	// other references
	$(html).find("*[id|=cite_note]").remove();
	// disambiguation box
	$(html).find("#disambigbox").remove();
	// errors
	$(html).find(".error").remove();
	$(html).find(".hatnote").remove();
	// external links
	$(html).find(".external.free").remove();
	// redirects
	$(html).find(".mw-redirect").remove();
	
	// image
	$(html).find(".thumb.tleft, .thumb.tright, .floatleft, .floatright").css(
	{
		"display": "flex",
		"justify-content": "center",
		"margin": "1em",
		"padding": "1em"
	});
	
	// image caption
	$(html).find(".thumbinner").css(
	{
		"text-align": "center",
		"font-style": "italic"
	});
	
	// reduce list left padding
	$(html).find("ul,ol").css("padding", "1em");
	
	// multi-column
	$(html).find(".div-col").css(
	{
		"column-count": "1",
		"margin": "2.5em 0em"
	});
	
	// generic dl
	$(html).find("dl").css("margin", "1em");
	// dl for math formulas
	$(html).find("dl").has(".mwe-math-element").css("text-align", "center");
	
	// let semantic handle tables
	$(html).find(".wikitable, table").addClass("ui orange table");
	$(html).find(".wikitable, table").css("margin-bottom", "2em");
	$(html).find(".wikitable caption, table caption").css(
	{
		"margin-bottom": "1em",
		"font-weight": "bold"
	});
	
	// scroll table overflow
	let wrapper = $("<div></div>").css("overflow", "auto");
	$(html).find(".wikitable, table").wrap(wrapper);
	
	html[0].normalize();
	return html[0];
}



function loadWiki(page, sectionIndex)
{
	return $.ajax(
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
		success: function(result)
		{
			$("#content_wiki").html(filterWiki(result));
			
			$("#content_wiki a").each(function()
			{
				//this.href = "//en.wikipedia.org" + this.pathname;
				
				let hrefArray = this.href.split("/");
				let page = hrefArray[hrefArray.indexOf("wiki") + 1];
				
				if ($(this).has("img").length)
				{
					$(this).attr("img-src", page);
					$(this).removeAttr("href");
					
					$(this).click(handleImgClick);
				}
				else
				{
					this.href = "?page=" + page.replaceAll("_", " ");
				}
			});
			
			$("#content_wiki a").click(function(e)
			{
				e.preventDefault();
				
				if (isValidString(this.href))
				{
					handleLoad(this, true);
				}
			});
			
			$("#content_wiki img").each(function()
			{
				this.src = this.src.replace("file://", "https://upload.wikimedia.org");
			});
		},
		error: function(error)
		{
			console.log(error);
			$("#content_wiki").html(error);
		},
	});
}



function loadCrossref(page, sectionName)
{
	return $.ajax(
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
		}
	});
}



function updateContent(page, sectionIndex, sectionName)
{
	$("#content_wiki_container .loader").removeClass("disabled");
	$("#content_wiki_container").dimmer("show");
	$("#column_crossref .loader").removeClass("disabled");
	$("#column_crossref").dimmer("show");
	
	loadWiki(page, sectionIndex).done(function()
	{
		$("#content_wiki_container").dimmer("hide");
		$("#content_wiki_container .loader").addClass("disabled");
		//$("#content_wiki img.thumbimage").attr("class", "ui medium rounded image"); ???
	});
	
	loadCrossref(page, sectionName).done(function()
	{
		$("#column_crossref").dimmer("hide");
		$("#column_crossref .loader").addClass("disabled");
	});
}



function getDropdownValues(sections, selected)
{
	let values = [];
	
	sections.unshift(
	{
		index: "0",
		line: "Summary",
		toclevel: 1
	});
	
	for (section of sections)
	{
		if (section.line != "References" &&
			section.line != "External links" &&
			section.line != "Further reading" &&
			section.line != "Bibliography" &&
			section.line != "See also" &&
			section.line != "Notes" &&
			section.line != "Notes and references" &&
			section.line != "Media" &&
			section.toclevel == 1)
		{
			values.push(
			{
				value: section.index,
				name: section.line
			});
		}
	}
	
	let select = values.filter(value => value.value == selected);
		
	if (select.length)
	{
		select[0].selected = true;
	}
	else
	{
		throw "section not found";
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
		
		if (!section)
		{
			section = 0;
		}
		
		$.ajax(
		{
			url: "http://en.wikipedia.org/w/api.php",
			data:
			{
				action: "parse",
				redirects: true,
				page: page,
				prop: "sections",
				format: "json"
			},
			dataType: "jsonp",
			success: function(result, status, xhr)
			{
				let sections = result.parse.sections;
				let values = getDropdownValues(sections, section);
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
				
				updateContent(page, section, sections[section].line);
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
	
	if (!isValidString(search))
	{
		// ...
	}
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "query",
			list: "search",
			srsearch: search,
			format: "json"
		},
		dataType: "jsonp",
		success: function(result, status, xhr)
		{
			let results = result.query.search;
			
			if (results.length)
			{
				let link = $("<a>").attr("href", "?page=" + results[0].title)[0];
				handleLoad(link, true);
			}
			else
			{
				//no result
				// ...
				
				$("#main_title").text("RAVE");
				$("#content_wiki").text("no result");
			}
		},
		error: function(xhr, status, error)
		{
			console.error(error);
		}
	});
}



function updateResponsiveness()
{
	// Sometimes CSS media queries and JQuery window.width work differently,
	// so we better check for CSS properties instead of window.width
	let resp_str = $("#resp_check").css("content").replaceAll("\"", "");
	// Edge always sees content as an empty string
	let resp_str_edge = $("#resp_check").css("flex-grow");
	
	if (resp_str == "Mobile" || resp_str_edge == "0")
	{
		window.device = 0;
		
		if (!$("#search_bar").is(":focus"))
			$("#header_input").detach().insertAfter("#header_flex");
		$("#column_wiki").removeClass("segment");
		
		$("#column_crossref").removeClass("blurring");
		$("#content_wiki_container").removeClass("blurring");
	}
	else
	{
		if (resp_str == "Tablet" || resp_str_edge == "1")
		{
			window.device = 1;
			
			if (!$("#search_bar").is(":focus"))
				$("#header_input").detach().insertAfter("#header_home");
		}
		else
		{
			window.device = 2;
			
			$("#header_input").detach().insertAfter("#header_home");
		}
		
		$("#column_wiki").addClass("segment");
		$("#column_crossref").addClass("blurring");
		$("#content_wiki_container").addClass("blurring");
	}
}



$(document).ready(function()
{
	// Init //
	
	$("body").on("dragstart", false);
	$("#modal_login").modal({duration: 300, transition: "fade down"});
	
	updateResponsiveness();
	$(window).resize(updateResponsiveness);
	
	$("#search_bar").focusout(function(event)
	{
		updateResponsiveness();
	});
	
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
		startSearch();
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
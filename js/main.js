window.rave = {};



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



function getDescendantTextNodes(node)
{
	let nodes = [];
	
	$(node).not("[djenius_ignore]").contents().each(function()
	{
		if (this.nodeType == Node.TEXT_NODE)
			nodes.push(this);
		else
			nodes.pushArray(getDescendantTextNodes(this));
	});
	
	return nodes;
}



function createKeywordAnnotations()
{
	Djenius.setAnnotationsVisible(false);
	
	// For each p in wiki content
	$("#content_wiki > .mw-parser-output > p").each(function(index, p)
	{
		Djenius.setAnnotatable(p, "p" + String(index));
		
		// Retrieve keywords
		
		let text = $(p).text();
		let keyws = getKeywords(text, 5);
		
		// Wrap keywords in spans
		
		let textNodes = getDescendantTextNodes(p);
		
		for (let textNode of textNodes)
		{
			let text = textNode.data;
			
			for (let keyw of keyws)
			{
				let repl = "<span rave-keyword>" + keyw + "</span>";
				
				text = text.replace(keyw, function(match)
				{
					keyws.removeAt(keyws.indexOf(keyw));
					return repl;
				});
			}
			
			let textSpan = document.createElement("span");
			textSpan.innerHTML = text;
			
			textNode.parentElement.replaceChild(textSpan, textNode);
		}
		
		// Add annotations
		
		let sel = window.getSelection();
		
		$(p).find("[rave-keyword]").each(function(index, span)
		{
			let range = document.createRange();
			range.setStartBefore(span);
			
			let temp = span;
			while (!temp.nextSibling)
			{
				temp = temp.parentNode;
			}
			
			range.setEnd(temp.nextSibling, 0);
			sel.addRange(range);
			
			let text = $(span).text();
			//$(span).contents().unwrap();
			
			Djenius.newAnnotation("crossref",
			{
				annotation: text,
				public: 0
			});
			
			sel.removeAllRanges();
		});
	});
	
	Djenius.setAnnotationsVisible(true);
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
	$(html).find(".external.autonumber").remove();
	// citation needed and similar
	$(html).find("sup.noprint").remove();
	// play button
	$(html).find("a").has(".play-btn-large").remove();
	// quote box
	$(html).find(".quotebox.pullquote").remove();
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
	
	// empty ul
	$(html).find("ul").filter(function()
	{
		return !isValidString(this.innerHTML);
	}
	).remove();
	
	// whitelist:
	// .mw-redirect
	
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



function loadSection()
{
	$("#content_wiki_container .loader").removeClass("disabled");
	$("#content_wiki_container").dimmer("show");
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data:
		{
			action: "parse",
			redirects: true,
			page: rave.page,
			section: rave.section,
			prop: "text",
			format: "json"
		},
		dataType: "jsonp",
		success: function(result)
		{
			let wikiContent = filterWiki(result);
			
			$(wikiContent).find("a:not(.external.text)").each(function()
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
			
			$(wikiContent).find("a").click(function(e)
			{
				e.preventDefault();
				
				if (isValidString(this.href))
				{
					handleLoad(this, true);
				}
			});
			
			$(wikiContent).find("img").each(function()
			{
				let rplc = "https://";
				if (!this.src.includes("upload.wikimedia.org"))
					rplc += "upload.wikimedia.org";
					
				this.src = this.src.replace("file://", rplc);
			});
			
			$("#content_wiki").html(wikiContent);
			Djenius.resetAnnotations();
			
			if (rave.mashup)
			{
				createKeywordAnnotations();
			}
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
		}
	});
}



function getDropdownValues(sections)
{
	let values = [];
	
	sections.unshift(
	{
		index: "0",
		line: "Summary",
		toclevel: 1
	});
	
	for (let section of sections)
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
	
	let select = values.filter(value => value.value == rave.section);
		
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



function loadWiki()
{
	let data =
	{
		action: "parse",
		redirects: true,
		page: rave.page,
		prop: "categories|revid|sections|text",
		format: "json"
	};
	
	if (rave.version != "0")
	{
		data.oldid = rave.version;
	}
	
	$.ajax(
	{
		url: "http://en.wikipedia.org/w/api.php",
		data: data,
		dataType: "jsonp",
		success: function(result)
		{
			// Update mashup visualization
			
			rave.mashup = result.parse.categories.map(x => x["*"]).includes("Emerging_technologies");
			updateResponsiveness();
			
			// Get revision id
			
			rave.version = result.parse.revid;
			
			// Populate dropdown
			
			let sections = result.parse.sections;
			let values = getDropdownValues(sections);
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
						pushHistoryState(rave.page, value.toString());
						rave.section = value;
						loadSection();
					}
				}
			});
			
			loadSection();
		},
		error: function(xhr, status, error)
		{
			console.error(error);
		},
		complete: function(xhr, status)
		{
			$("#main_dropdown").removeClass("disabled");
			$("#main_dropdown").removeClass("loading");
		}
	});
}



function loadPage(page, section)
{
	$("#main_dropdown").dropdown({action: "nothing"});
	$("#main_dropdown").dropdown("change values");
	$("#main_dropdown").addClass("disabled");
	
	if (isValidString(page))
	{
		// Wiki //
		
		if ($("#main_container").is(":hidden"))
		{
			$("#home_container").hide();
			$("#main_container").show();
		}
		
		$("#main_dropdown").addClass("loading");
		
		if (!section)
		{
			section = 0;
		}
		
		rave.page = page;
		rave.section = section;
		
		$.ajax(
		{
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/version?page=" + page,
			dataType: "text",
			success: function(result)
			{
				//
				console.log(result);
				//
				
				rave.version = result;
				loadWiki();
			},
			error: function(xhr, status, error)
			{
				console.error(error);
			}
		});
	}
	else
	{
		// Homepage //
		if ($("#home_container").is(":hidden"))
		{
			$("#main_container").hide();
			$("#home_container").show();
		}
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



function loadCrossref(word)
{
	$("#column_crossref .loader").removeClass("disabled");
	$("#column_crossref").dimmer("show");
	
	return $.ajax(
	{
		url: "https://api.crossref.org/works?query="+ rave.page.split(" ").join("+") + "+" + word.split(" ").join("+") + "&rows=5&sort=score",
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



function initDjenius()
{
	Djenius.setIdleAnnotationColor("crossref", "#66ccff");
	Djenius.setActiveAnnotationColor("crossref", "#66ccff");
	
	Djenius.setIdleAnnotationColor("user", "rgb(252,198,46)");
	Djenius.setActiveAnnotationColor("user", "rgb(252,198,46)");
	
	Djenius.setNewUserSelection_Handler(function(params, resolve, reject)
	{
		// params = {ranges}
		
		if (params.ranges.length)
		{
			if (rave.device == 2)
			{
				$("#djenius_segment").show();
			}
			else
			{
				$("#sidebar_bottom")
					.sidebar("setting", "mobileTransition", "overlay")
					.sidebar("setting", "dimPage", false)
					.sidebar("setting", "closable", false)
					.sidebar("show");
			}
		}
		else if ($("#djenius_button_new").is(":visible"))
		{
			if (rave.device == 2)
			{
				$("#djenius_segment").hide();
			}
			else
			{
				$("#sidebar_bottom").sidebar("hide");
			}
		}
	});
	
	Djenius.setProvideAnnotationProperties_Handler(function(params, resolve, reject)
	{
		if (rave.device == 2)
		{
			$("#djenius_button_new").hide();
			$("#djenius_form").show();
		}
		else
		{
			$("#sidebar_right")
				.sidebar("setting", "mobileTransition", "overlay")
				.sidebar("setting", "dimPage", true)
				.sidebar("setting", "closable", false)
				.sidebar("show");
		}
		
		$("#djenius_button_cancel").off().click(function()
		{
			reject();
			
			if (rave.device == 2)
			{
				$("#djenius_form").hide();
				$("#djenius_button_new").show();
			}
			else
			{
				$("#sidebar_right").sidebar("hide");
			}
			
			$("#djenius_textarea")[0].value = "";
			$("#djenius_dropdown").dropdown("set selected", "0");
		});
		
		$("#djenius_button_submit").off().click(function()
		{
			let comment = $("#djenius_textarea")[0].value;
			let _public = $("#djenius_dropdown").dropdown("get value");
			
			if (isValidString(comment))
			{
				resolve(
				{
					annotation: comment,
					public: _public
				});
			}
			else
			{
				reject();
			}
			
			if (rave.device == 2)
			{
				$("#djenius_form").hide();
				$("#djenius_button_new").show();
			}
			else
			{
				$("#sidebar_right").sidebar("hide");
			}
			
			$("#djenius_textarea")[0].value = "";
			$("#djenius_dropdown").dropdown("set selected", "0");
		});
	});
	
	/*
	Djenius.setChooseAnnotation_Handler(function(params, resolve, reject)
	{
		// params = {spanIds, relSpans, anchor}
		// ...
	});
	*/
	
	Djenius.setShowAnnotation_Handler(function(params, resolve, reject)
	{
		// params = {annotation}
		console.log(params.annotation);
		
		let anno = params.annotation;
		if (anno.class == "crossref")
		{
			// Crossref annotation
			loadCrossref(params.annotation.properties.annotation);
		}
		else
		{
			// User annotation
			// ...
		}
	});
	
	Djenius.setServerRequest_Handler(function(params, resolve, reject)
	{
		let obj =
		{
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/djenius",
			dataType: "text",
			success: function(data)
			{
				resolve(data);
			},
			error: function(error)
			{
				reject(error);
			}
		};
		
		switch (params.request)
		{
			case Djenius.ServerRequest.create:
				
				if (params.data.class == "crossref")
				{
					let anno = Djenius.getAnnotationsCollection();
					anno.push(params.data);
					resolve(anno);
					return;
				}
				
				obj.method = "POST";
				obj.data = JSON.stringify(
				{
					page: rave.page,
					section: rave.section,
					version: rave.version,
					data: params.data
				});
				obj.contentType = "application/json";
				break;
				
			case Djenius.ServerRequest.read:
				
				obj.url += "?page=" + rave.page;
				obj.method = "GET";
				break;
				
			case Djenius.ServerRequest.update:
				
				obj.method = "PUT";
				obj.data = JSON.stringify(params.data);
				obj.contentType = "application/json";
				break;
				
			case Djenius.ServerRequest.delete:
				
				obj.method = "DELETE";
				obj.data = JSON.stringify(
				{
					data: params.data
				});
				obj.contentType = "application/json";
				break;
		}
		
		$.ajax(obj);
	});
	
	$("#djenius_button_new").click(function()
	{
		Djenius.newAnnotation();
	});
	
	$("#djenius_dropdown").dropdown(
	{
		values:
		[
			{
				value: "0",
				name: "Private",
				selected: true
			},
			{
				value: "1",
				name: "Public"
			}
		]
	});
	
	if (rave.device == 2)
	{
		$("#djenius_form").hide();
	}
}



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



function toggleBlurring(enable)
{
	if (enable)
	{
		$("#column_crossref").addClass("blurring");
		$("#content_wiki_container").addClass("blurring");
	}
	else
	{
		$("#column_crossref").removeClass("blurring");
		$("#content_wiki_container").removeClass("blurring");
	}
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
		rave.device = 0;
		
		if (!$("#search_bar").is(":focus"))
			$("#header_input").detach().insertAfter("#header_flex");
		
		$("#content_wiki_container").removeClass("large segment");
		$("#sidebar_bottom").append($("#djenius_button_new"));
		$("#sidebar_right").append($("#djenius_form"));
		
		toggleBlurring(false);
	}
	else
	{
		if (resp_str == "Tablet" || resp_str_edge == "1")
		{
			rave.device = 1;
			
			if (!$("#search_bar").is(":focus"))
				$("#header_input").detach().insertAfter("#header_home");
			
			$("#sidebar_bottom").append($("#djenius_button_new"));
			$("#sidebar_right").append($("#djenius_form"));
			
			toggleBlurring(false);
		}
		else
		{
			rave.device = 2;
			
			$("#header_input").detach().insertAfter("#header_home");
			$("#djenius_segment").append($("#djenius_button_new"));
			$("#djenius_segment").append($("#djenius_form"));
			
			toggleBlurring(true);
		}
		
		$("#content_wiki_container").addClass("large segment");
	}
	
	// Mashup
	
	if (rave.mashup)
	{
		if (rave.device == 1)
		{
			$("#column_crossref").show();
			
			let classList = $("#column_wiki")[0].classList.value;
			classList = classList.replaceAll("sixteen wide", "nine wide");
			$("#column_wiki")[0].classList = classList;
		}
		else
		{
			$("#column_crossref").css("visibility", "visible");
		}
	}
	else
	{
		if (rave.device == 1)
		{
			$("#column_crossref").hide();
			
			let classList = $("#column_wiki")[0].classList.value;
			classList = classList.replaceAll("nine wide", "sixteen wide");
			$("#column_wiki")[0].classList = classList;
		}
		else
		{
			$("#column_crossref").css("visibility", "hidden");
		}
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
	
	
	$("#main_container").hide();
	
	$("#home_container a").click(function(event)
	{
		event.preventDefault();
		if (isValidString(this.href))
        {
          handleLoad(this, true);
        }
	});
	
	
	initDjenius();
	
	
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
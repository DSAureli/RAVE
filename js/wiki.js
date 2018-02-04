function handleImgClick()
{
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
			
			$("#image_modal img")[0].src = result.query.pages["-1"].imageinfo["0"].url;
		}
	});
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
			$("#content_wiki").html(result.parse.text["*"]);
			
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
			
			$("#content_wiki img").each(function()
			{
				this.src = this.src.replace("file://", "https://upload.wikimedia.org");
				
				//$(this).attr("rave-href", "https://en.wikipedia.org" + this.pathname);
				//$(this).removeAttr("href");
			});
		},
		error: function(error)
		{
			console.log(error);
			$("#content_wiki").html(error);
		},
	});
}
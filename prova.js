// You don't need to write anything in the form. All the calls have their own parameters.
$(document).ready(function(){
	
	//registrati
	$("#signUp").click(function()
	{
		var email= $("form [name=email]").val("dav@dav");
		var password= $("form [name=password]").val("dav");
		var password= $("form [name=name]").val("dav");
		$.ajax(
			{
				url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/sign",
				method: "POST",
				data: $("#form").serialize(),
				success: function(data)
				{
					alert(data);
				}
			});
	});
	
	//loggati
	$("#login").click(function()
	{
		var email= $("form [name=email]").val("gio@gio");
		var password= $("form [name=password]").val("gio");
		$.ajax(
			{
				url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/login",
				method: "POST",
				data: $("#form").serialize(),
				success: function(data)
				{
					alert(data);
				}
			});
	});
	
	//aggiungi commento
	$("#x").click(function()
	{
		
		var obj = 
		{
			page: "page",
			section: 1,
			version: 2.42,
			data:
			{
				class:"string",
				id: "59dfad40-a793-4129-9800-3f757b984da6",
				ranges:
				[
					{
						djeniusSelID: "1",
						startOffset: 9,
						endOffset: 31,
						path:
						[
							5,
							5,
							1
						]
					}
				],
				properties:
				{
					annotation: "Djenius is awesome!",
					public: 1
				}
			}
		}
		var send = JSON.stringify(obj);
		$.ajax({
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/djenius",
			contentType: "application/json",
			method: "POST",
			data: send,
			dataType: "text",
			success: function(data){
				$("p").text(data);
			}
		});
	});
	
	//change comment
	$("#y").click(function()
	{
		var change = 
		{
			page: "page",
			data:
			{
				class:"string",
				id: "59dfad40-a793-4129-9800-3f757b984da6",
				ranges:
				[
					{
						djeniusSelID: "1",
						startOffset: 9,
						endOffset: 31,
						path:
						[
							5,
							5,
							1
						]
					}
				],
				properties:
				{
					annotation: "Giorgio is a djenius!",
					public: 0
				}
			}
		}
		var z = JSON.stringify(change);
		$.ajax({
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/djenius",
			contentType: "application/json",
			method: "PUT",
			data: z,
			dataType: "text",
			success: function(data){
				$("p").text(data);
			}
		});
	});
	
	//get version
	$("#z").click(function()
	{
		var get = 
		{
			page: "page",
			section: 1
		}
		var w = JSON.stringify(get);
		$.ajax({
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/version?page=page",
			method: "GET",
			dataType: "text",
			success: function(data){
				$("p").text(data);
			}
		});
	});
	
	//delete annotation
	$("#w").click(function()
	{
		var miao = 
		{
			page: "page",
			data:
			{
				
				id: "59dfad40-a793-4129-9800-3f757b984da6"
			}	
		}
		var m = JSON.stringify(miao);
		$.ajax({
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/djenius",
			contentType: "application/json",
			method: "DELETE",
			data: m,
			dataType: "text",
			success: function(data){
				$("p").text(data);
			}
		});
	});
	
	//get all annotations for the page
	$("#q").click(function()
	{
		$.ajax({
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/djenius?page=page",
			method: "GET",
			dataType: "text",
			success: function(data){
				$("p").text(data);
			}
		});
	});
	
	
});
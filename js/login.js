$(document).ready(function()
{
	// ($("#login_menu > a.active")[0].id == "login_tab")
	// returns true if login is active, false if registration is active
	
	$(".ui.form").form(
	{
		fields:
		{
			email:
			{
				identifier   : 'email',
				rules:
				[
					{
					  type   : 'empty',
					  prompt : 'Please enter your e-mail'
					},
					{
					  type   : 'email',
					  prompt : 'Please enter a valid e-mail'
					}
				]
			},
			
			password:
			{
				identifier   : 'password',
				rules:
				[
					{
					  type   : 'empty',
					  prompt : 'Please enter your password'
					},
					{
					  type   : 'length[6]',
					  prompt : 'Your password must be at least 6 characters'
					}
				]
			},
		},
		onSuccess: function(event, fields)
		{
			event.preventDefault();	
			let url= $("#login_tab").hasClass("active") ? "login" : "sign";
			$.ajax(
			{
				url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/" + url,
				method: "POST",
				data: $("#login_form").serialize(),
				success: function(data)
				{
					data = parseInt(data);
					if(data)
					{
						$("#login_error").html("<ul class='list'><li>Wrong password or email</li></ul>");
						$("#login_error").show();
					}
					else
					{
						$("#login_error").empty();
						$("#login_error").hide();
						$("#login_modal").modal("hide");
						$("#header_logout").show();
						$("#header_login").hide();
					}
				},
				error: function(error)
				{
					$("#login_error").html("<ul class='list'><li>Connection error</li></ul>");
				}
			});
		}
		
	});
	
	$("#login_menu > a").click(function(e)
	{
		if (!$(this).hasClass("active"))
		{
			$("#login_menu > a.active").removeClass("active");
			$(this).addClass("active");
			
			$("#login_form > .registration.field").animate(
			{
				height: "toggle",
				margin: "toggle"
			},
			200,
			function()
			{
				$("#login_form > .registration.field input").val("");
			});
			
			$("#login_form .field.error").removeClass("error");
			
			if ($("#login_error").height())
			{
				$("#login_error").animate(
				{
					height: 0,
					margin: 0,
				},
				200,
				function()
				{
					$("#login_error").empty();
					$("#login_error")
						.css("height", "auto")
						.css("margin", "2em 0")
						.css("display", "");
				});
			}
			
			if (this.id == "login_tab")
			{
				$("#login_segment").animate({top: 0}, 200);
				$("#login_button_text").animate({opacity: 0}, 100, function()
				{
					$(this).text("Log in").animate({opacity: 1}, 100);
				});
				
				$("#login_form").form("remove rule", "username");
				$("#login_form").form("remove rule", "emailCheck");
				$("#login_form").form("remove rule", "passwordCheck");
			}
			else
			{
				$("#login_form").form("add rule", "username", ["empty", "length[3]"]);
				$("#login_form").form("add rule", "emailCheck", "match[email]");
				$("#login_form").form("add rule", "passwordCheck", "match[password]");
				
				$("#login_segment").animate({top: -78}, 200);
				$("#login_button_text").animate({opacity: 0}, 100, function()
				{
					$(this).text("Sign up").animate({opacity: 1}, 100);
				});
			}
		}
	});
	
	$("#header_login").click(function(e)
	{
		let blur = window.device ? true : false;
		
		$("#login_modal").modal(
		{
			blurring: blur,
			duration: 300,
			onShow: function()
			{
				$("#login_form > .registration.field").hide();
			},
			onHidden : function()
			{
				//$("#login_form")[0].reset();
				$("#login_form > .field input[type='password']").val("");
				
				$("#login_form .field.error").removeClass("error");
				$("#login_error").empty();
				
				$("#login_tab").click();
			}
		}).modal("show");
	});
	
	$("#header_logout").hide();
	
	$("#header_logout").click(function(e){
		$.ajax(
		{
			url: "http://site1767.tw.cs.unibo.it/wsgi/wsgi.wsgi/login",
			method: "DELETE",
			success: function(data)
			{
				$("#header_logout").hide();
				$("#header_login").show();
			},
			error: function(error)
			{
				console.log("error logging out");
			}
		});
	});
	
});
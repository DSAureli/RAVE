$(document).ready(function()
{
	var reg = false;
	
	$("#header_login").click(function(e)
	{
		e.preventDefault();
		$("#modal_login").modal("show");
	});
	
	$("#modal_login .remove.icon.link").click(function(e)
	{
		$("#modal_login").modal("hide");
		$("#modal_login .ui.inverted.error.message").empty();
		$("#modal_login .registration").addClass("hidden");
		$("#modal_login input[type='text']").form("clear");
		$("#modal_login input[type='password']").form("clear");
		
		//reset login as default
		reg = false;
		$("#modal_login h2 p").text("Login to your account");
		$("#modal_login .submit.button").text("Login");
		$("#modal_login .segment.message p").text("New to us?");
		$("#modal_login .segment.message a").text("Sign Up");
	});
	
	$("#signUp").click(function(e)
	{
		e.preventDefault();
		reg = !reg;
		$("#modal_login .hidden").removeClass("hidden");
		$("#modal_login .form").form("add rule", "userName", ["empty", "length[3]"]);
		$("#modal_login .form").form("add rule", "emailCheck",  "match[email]");
		$("#modal_login .form").form("add rule", "passwordCheck",  "match[password]");
		if(reg==true)
		{
			$("#modal_login h2 p").text("Register a new account");
			$("#modal_login .submit.button").text("Subscribe");
			$("#modal_login .segment.message p").text("Already registered?");
			$("#modal_login .segment.message a").text("Do the login");
			$("#modal_login .hidden").removeClass("hidden");
		}
		else
		{
			$("#modal_login h2 p").text("Login to your account");
			$("#modal_login .submit.button").text("Login");
			$("#modal_login .segment.message p").text("New to us?");
			$("#modal_login .segment.message a").text("Sign Up");
			$("#modal_login .registration").addClass("hidden");
		}
	});
	
	$(".ui.form").form(
	{
		fields:
		{
			email:
			{
				identifier  : 'email',
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
				identifier  : 'password',
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
		onInvalid: function()
		{
			$(".field.error input").css({"border-color": "#9F3A38", "color": "#9F3A38"});
			$(".field.error .icon").css( "color", "#9F3A38");
		},
		onValid: function()
		{
			$(".field:not(.error) input").css({"border-color": "#8d8d8e", "color": "white"});
			$(".field:not(.error) .icon").css("color", "#9F3A38");
			$(".field:not(.error) .icon").removeAttr("style");
		}
	});
	
	
	
});

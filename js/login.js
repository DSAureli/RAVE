$(document).ready(function()
{
	$("#btn_login").click(function(e)
	{
		e.preventDefault();
		$("#modal_login").modal("show");
	});
	
	$("#modal_login .remove.icon.link").click(function(e)
	{
		$("#modal_login").modal("hide");
		$("#modal_login input[type='password']").val("");
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
			}
		}
	});
});
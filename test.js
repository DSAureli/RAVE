$(document).ready(function()
{
	$("#button").click(function()
	{
		var sel = window.getSelection();
		var range = sel.getRangeAt(0);
	});
	
	
	var a = [1,2,3,4];
	$.each(a, (i, o)=>
	{
		$.each(a, (j, p)=>
		{
			if (j != i)
				a.splice(j, 1);
		});
		console.log(o);
	});

	var a = [1,2,3,4];
	for (var i = 0; i < a.length; i++)
	{
		for (var j = 0; j < a.length;)
		{
			if (j != i)
				a.splice(j, 1);
			else
				j++;
		}
	}
	
	var b = 1;
});
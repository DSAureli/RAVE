function range(n)
{
	var a = [];
	for (var i = 0; i < n; i++)
		a[i] = i;
	return a;
}

String.prototype.format = function()
{
	var content = this;
	for (var i=0; i < arguments.length; i++)
	{
		var replacement = '{' + i + '}';
		content = content.split(replacement).join(arguments[i]);
	}
	return content;
};



// Is this needed?
String.prototype.insertAt = function(index, string)
{
	return this.slice(0, index) + string + this.slice(index);
};

// TOTEST
Array.prototype.pushArray = function(arr)
{
	for (var i of arr)
		this.push(i);
	
	return arr.length;
};

// TOTEST (check error message)
Array.prototype.removeAt = function(index)
{
	var retval;
	
	if (index > -1)
		retval = this.splice(index, 1);
	else
		console.error("Array.prototype.remove error: negative index");
	
	return retval;
};

// TOTEST
Array.prototype.lastElement = function()
{
	return this[this.length - 1];
};

jQuery.fn.extend
({
	hasDescendant: function(node)
	{
		return this.has($(node)).length;
	},
	
	isDescendantOf: function(node)
	{
		return $(node).has(this).length;
	}
});
function range(n)
{
	var a = [];
	for (var i = 0; i < n; i++)
		a[i] = i;
	return a;
}

// Is this needed?
String.prototype.insertAt = function(index, string)
{
	return this.slice(0, index) + string + this.slice(index);
};

// TOTEST
Array.prototype.pushArray = function(arr)
{
	for (var i in arr)
		this.push(arr[i]);
};

// TOTEST (check error message)
Array.prototype.removeAt = function(index)
{
	if (index > -1)
		this.splice(index, 1);
	else
		console.error("Array.prototype.remove error: negative index");
};

// TOTEST
Array.prototype.lastElement = function()
{
	return this[this.length - 1];
};

jQuery.fn.hasDescendant = function(node)
{
	return this.has($(node)).length;
};

jQuery.fn.isDescendantOf = function(node)
{
	return $(node).has(this).length;
};
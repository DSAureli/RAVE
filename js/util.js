function iter(n)
{
	let a = [];
	for (let i = 0; i < n; i++)
		a[i] = i;
	return a;
}

function isFunction(obj)
{
	return (typeof obj == "function");
}

function isString(obj)
{
	return (typeof obj === "string" || obj instanceof String);
}

function isValidString(obj)
{
	return isString(obj) && obj.trim();
}

Object.defineProperty(Array.prototype, "last",
{
	get: function()
	{
		return this[this.length - 1];
	}
});

Array.prototype.pushArray = function(arr)
{
	for (var i of arr)
		this.push(i);
	return arr.length;
};

Array.prototype.removeAt = function(index)
{
	if (index > -1)
		return this.splice(index, 1);
	else
		console.error("Array.prototype.removeAt: negative index");
};

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

String.prototype.replaceAll = function(search, replacement) 
{
    var target = this;
    return target.split(search).join(replacement);
};

// Are these needed?

String.prototype.insertAt = function(index, string)
{
	return this.slice(0, index) + string + this.slice(index);
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
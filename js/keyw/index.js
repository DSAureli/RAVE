var retext = require('retext');
var keywords = require('retext-keywords');
var nlcstToString = require('nlcst-to-string');

module.exports = function(text, max)
{
	var keyws = [];
	
	retext().use(keywords, max).process(text, function(err, file)
	{
		if (err) throw err;
		
		file.data.keywords.forEach(function(keyword)
		{
			keyws.push(nlcstToString(keyword.matches[0].node));
		});
	});
	
	return keyws;
}
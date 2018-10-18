const curl = require("curl");
const jsdom = require("jsdom");

function getTitlesAndPrices(body){
	const {JSDOM} = jsdom;
	const dom = new JSDOM(body);
	const $ = (require('jquery'))(dom.window);
	
	//get each products information DOM parent
	var products = $(".result-row p.result-info");
	
	for( var i=0; i<products.length; i++ ){
		var title = $(products[i]).children('a.result-title');
		
		var price = $(products[i]).children('.result-meta').children('.result-price');
		
		console.log( "title = " + title.text() );
		console.log( "price = " + price.text().replace(/\$/, "") );
	}
}

function sendToDB(body){
	getTitlesAndPrices(body);
}


const url = "https://newyork.craigslist.org/search/bka";
curl.get(url, null, (err,resp,body)=>{
  if(resp.statusCode == 200){
     sendToDB(body);
  }
  else{
     //some error handling
     console.log("error while fetching url");
  }
});

exports.handler = async (event) => {
	// TODO implement
	const response = {
		statusCode: 200,
		body: JSON.stringify('Lambda loading Craigslist page ... ')
	};
	return response;
};
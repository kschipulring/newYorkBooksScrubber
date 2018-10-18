const curl = require("curl");
const jsdom = require("jsdom");

function getTitlesAndPrices(body){
	const {JSDOM} = jsdom;
	const dom = new JSDOM(body);
	const $ = (require('jquery'))(dom.window);
	
	//get the titles just for now
	var titles = $("p.result-info a.result-title");
	
	console.log( titles[0].text );
	
	
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
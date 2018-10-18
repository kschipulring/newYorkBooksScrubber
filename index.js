const curl = require("curl");
const jsdom = require("jsdom");
const mysql = require('mysql');

const config = require('./config.json');

//the book info original source. may have something like '?s=240' at the end, the s variable is always multiple of 120
const base_url = "https://newyork.craigslist.org/search/bka";

//hard constants. first is how many maximum we ever want from a session.
const max_results = 1000;

//second is how many results that craigslist displays per its own pages (max, can be less if the total is too small)
const cl_results_pp = 120;

//the number that the final page will start at.  Will be 960 if above values are 1000 and 120
const final_page_start = parseInt(max_results / cl_results_pp) * cl_results_pp;


/*
should only be run once per AWS Lambda call for this Lambda function.
Used in all scenarios, whether DB insertions or search operations.
*/
const mysql_conn = mysql.createConnection({
	host: config.host,
	user: config.user,
	password: config.password,
	port: config.port
});

//accepts html content as first argument.
function getDataFromCurlHtml(body, suffix){
	const {JSDOM} = jsdom;
	const dom = new JSDOM(body);
	const $ = (require('jquery'))(dom.window);
	
	//get each products information DOM parent
	var products = $(".result-row p.result-info");
	
	var suffix = ( suffix !== null )? suffix : 0;
	
	var inserterVals = [];
	
	/*
	We never want total products for this session to be greater than const 'max_results'.
	So, if the suffix has the same value or greater than 'final_page_start', the maximum
	number of iterations in this loop will be 'final_page_start' from 'max_results', unless
	products.length here happens to be smaller than that for some reason
	*/
	if( suffix >= final_page_start ){
		var loop_max = Math.min( (max_results - final_page_start), products.length );
	}else{
		var loop_max = products.length;
	}
	
	//loop through the products from the craigslist page
	for( var i=0; i<loop_max; i++ ){
		let title = $(products[i]).children('a.result-title').text().replace(/'/g, "\\'");
		
		let price = $(products[i]).children('.result-meta').children('.result-price').text().replace(/\$/, "");
		
		price = parseFloat( price );
		
		//sometimes, for some reason, there is no price included
		if( isNaN(price) ){
			price = 0;
		}
		
		let url = $(products[i]).children('a.result-title').attr("href");
		
		let ts = Math.round((new Date()).getTime() / max_results);
		
		//this row now prepared to be inserted
		inserterVals.push( [ title, price, url, ts, suffix] );
	}
	
	//returning mysql friendly inserter rows
	return inserterVals;
}

function sendToDB(body, suffix=null){
	var inserterVals = getDataFromCurlHtml(body, suffix);

	//only connect to the DB for the first time
	if(suffix === null){
		mysql_conn.connect(function(err) {
			if (err) throw err;
			console.log("Connected from the const!");
		});
	}

	/*
	self evident, insert statement, using prepared statement technique.
	Also using 'IGNORE' keyword to gently deal with overwrites, READ: without error complaints.
	*/
	var sql = "INSERT IGNORE INTO bookreader.newyork_books (title, price, url, time_insert, orig_page) VALUES ?";

	//where the insertion magic occurs
	mysql_conn.query(sql, [inserterVals], function (err, result) {
		if (err) throw err;
		console.log("Number of records inserted: " + result.affectedRows);
	});

	//disconnnect from the DB if this is the last time / last page curl grab.
	if( suffix === final_page_start ){	
		mysql_conn.end();
	}
}

function getCurledPage(suffix = null){
	var get_url = base_url;
	
	get_url += ( suffix !== null )? "?s=" + suffix : "";
	
	curl.get(get_url, null, (err,resp,body) => {
		if(resp.statusCode == 200){
			sendToDB(body, suffix);
			
			if(suffix === null || suffix < final_page_start){
				if( suffix === null ){
					suffix = cl_results_pp;
				}else{
					suffix += cl_results_pp;
				}
				
				getCurledPage(suffix);
			}
		}else{
			//some error handling
			console.log("error while fetching url");
		}
	});
}


//start the magic for curl to insertions
getCurledPage();


exports.handler = async (event) => {
	// TODO implement
	const response = {
		statusCode: 200,
		body: JSON.stringify('Lambda loading Craigslist page ... ')
	};
	return response;
};
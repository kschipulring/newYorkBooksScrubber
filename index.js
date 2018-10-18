const curl = require("curl");
const jsdom = require("jsdom");
const mysql = require('mysql');

const config = require('./config.json');

const mysql_conn = mysql.createConnection({
	host: config.host,
	user: config.user,
	password: config.password,
	port: config.port
});

function getTitlesAndPrices(body){
	const {JSDOM} = jsdom;
	const dom = new JSDOM(body);
	const $ = (require('jquery'))(dom.window);
	
	//get each products information DOM parent
	var products = $(".result-row p.result-info");
	
	var inserterVals = [];
	
	for( var i=0; i<products.length; i++ ){
		var title = $(products[i]).children('a.result-title').text().replace(/'/g, "\\'");
		
		var price = $(products[i]).children('.result-meta').children('.result-price').text().replace(/\$/, "");
		
		price = parseFloat( price );
		
		if( isNaN(price) ){
			price = 0;
		}
		
		inserterVals.push( [ title, price] );
	}
	
	return inserterVals;
}

function sendToDB(body){
	var inserterVals = getTitlesAndPrices(body);

	mysql_conn.connect(function(err) {
		if (err) throw err;
		console.log("Connected from the const!");
	});
	
	var sql = "INSERT INTO bookreader.newyork_books (title, price) VALUES ?";

	
	var values = inserterVals;
	
	console.log( values );
	
	/*
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("selected");
	});*/
	
	mysql_conn.query(sql, [values], function (err, result) {
		if (err) throw err;
		console.log("Number of records inserted: " + result.affectedRows);
	});

	mysql_conn.end();
}

//the book info original source
const url = "https://newyork.craigslist.org/search/bka";
curl.get(url, null, (err,resp,body) => {
	if(resp.statusCode == 200){
		sendToDB(body);
	}else{
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
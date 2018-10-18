const curl = require("curl");
const jsdom = require("jsdom");


const url = "https://newyork.craigslist.org/search/bka";
curl.get(url, null, (err,resp,body)=>{
  if(resp.statusCode == 200){
     console.log(body);
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
        body: JSON.stringify('Hello from Lambda haa!')
    };
    return response;
};
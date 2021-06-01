// Set express as Node.js web application
// server framework.
// To install express before using it as
// an application server by using 
// "npm install express" command.
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
//var multer = require('multer');
//var upload = multer();
var path = require('path');
var path = require('ejs');
var AWS = require('aws-sdk');

var s3 = new AWS.S3({
    accessKeyId: 'AKIAVVH2KSB72PLJPBTJ',
    secretAccessKey: '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'
});
var app = express();

app.use("/images", express.static('images'));
app.use("/js", express.static('js'));
app.use("/static", express.static('static'));
app.use("/static/images", express.static('static/images'));
app.use("/static/js", express.static('static/js'));
app.use("/static/css", express.static('static/css'));
// Set EJS as templating engine
app.set('view engine', 'ejs');
// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
//app.use(upload.array()); 

var readUsers = fs.readFileSync("data/users.json", 'utf8');
var readAdmins = fs.readFileSync("data/admins.json", 'utf8');
var userPapers=[];
var params = {
    Bucket: 'chaanakya'    
};

var allKeys = [];
//listAllKeys();
function listAllKeys() {
    s3.listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            var contents = data.Contents;
            contents.forEach(function (content) {
                allKeys.push(content.Key);
            });

            if (data.IsTruncated) {
                params.ContinuationToken = data.NextContinuationToken;
                console.log("get further list...");
                listAllKeys();
            } 

        }
    });
}

app.get('/images/:nm', (req, res)=>{
	console.log(req.params.nm);
        res.send(fs.readFileSync("images/"+req.params.nm));
});

app.get('/', (req, res)=>{
  
// The render method takes the name of the HTML
// page to be rendered as input
// This page should be in the views folder
// in the root directory.
res.render('home',{userNotFound:false});

  
});

app.get('/admin', (req, res)=>{
  
// The render method takes the name of the HTML
// page to be rendered as input
// This page should be in the views folder
// in the root directory.
res.render('admin',{userNotFound:false});

  
});

app.post('/', (req, res)=>{
   console.log(req.body);
//lookup req.body.id in our records
//pull or create answersheet
//render quiz 

var userAuthDone= false;
var quizFileForUser="";
var userNm = "";

  var jsonContent = JSON.parse(readUsers);
  for (var i = 0; i<jsonContent.length; i++) {
    if((jsonContent[i]["userid"])==(req.body.uid))
	{
		if((jsonContent[i]["login_key"]) == (req.body.lkey)){
			quizFileForUser = "quiz" + jsonContent[i]["age_group"].toString() + ".json";
			userNm = jsonContent[i]["name"].toString();
			userAuthDone=true;
			break;
		}
	}
  }
  if(!userAuthDone)
  {
	  res.render('home',{userNotFound:true});
	  return;
  }
  
  var key = Date.now();
  var readQuiz = fs.readFileSync("data/"+quizFileForUser, 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  jsonContent.quiztaker["userid"]=req.body.uid;
  jsonContent.quiztaker["userFullName"]=userNm;
  jsonContent.quiztaker["exam_started_on"]= key;
  var jsonString = JSON.stringify(jsonContent);
	  fs.writeFile('userq/'+req.body.uid+'_'+key+'_quiz.json', jsonString, function (err) {
	  if (err) throw err;
	  console.log('userq/'+req.body.uid+'_'+key+'_quiz.json Saved!');
  });
  //fs.writeFile("userq/ch01-quiz2.json", jsonString);
  
  var d = JSON.parse("{}");
  d["name"] = userNm;
  d["uid"]=req.body.uid;
  d["skey"]=key;
  res.render('nquiz',{data:d});
  
});
/*
function fileExist(fName, _data)
{
	
	var e=false;
	for(var i=0;i<_data.length;i++)
	{
		console.log(_data[i].Key);
		if(_data[i].Key==fName)
		{
			e=true;
			console.log('File - '+fName+' found on s3');
		}
	}
	
	return e;
}
*/
app.post('/admin', (req, res)=>{
   console.log(req.body);
//lookup req.body.id in our records
//pull or create answersheet
//render quiz 

var userAuthDone= false;
var quizFileForUser="";
var userNm = "";

  var jsonContent = JSON.parse(readAdmins);
  for (var i = 0; i<jsonContent.length; i++) {
    if((jsonContent[i]["userid"])==(req.body.uid))
	{
		if((jsonContent[i]["login_key"]) == (req.body.lkey)){
			userNm = jsonContent[i]["name"].toString();
			userAuthDone=true;
			break;
		}
	}
  }
  if(!userAuthDone)
  {
	  res.render('admin',{userNotFound:true});
	  return;
  }
  
  var key = Date.now();
  var d = JSON.parse("{}");
  d["name"] = userNm;
  d["uid"]=req.body.uid;
  d["skey"]=key;
  res.render('admquiz',{data:d});
  
});

app.post('/getuserstat', (req, res)=>{
   console.log("getuserstat "+req.body);
//provide api if individual answers are to be updated
//lookup req.body.id in our records
//pull answersheet if exist
//update answer


//check s3 location
 const params = {
        Bucket: 'chaanakya',
  	MaxKeys: 200
 };
 s3.listObjectsV2(params, function(err, data) {
   if(err){console.log(err, err.stack); // an error occurred
   }
   else{
	  // console.log(data.Contents); 
	   //userPapers = data;
	   var contents = data.Contents;
            contents.forEach(function (content) {
                userPapers.push(content.Key);
            });
   }
 });
	 
var users = fs.readFileSync("data/users.json", 'utf8');
 var allusers = JSON.parse(users);
	
	console.log(userPapers);
for(var i=0;i<allusers.length;i++)
{
	let fExist=false;
	try {
		/*for(var m=0;m<userPapers.Contents.length;m++)
		{
			console.log(userPapers.Contents[m].Key);
			var fl="kbre/user_ans/"+allusers[i].userid+"_quiz.json";
			if(userPapers.Contents[m].Key==fl)
			{
				fExist=true;
				console.log("kbre/user_ans/"+allusers[i].userid+"_quiz.json found on s3");
			}
		}*/
		
	 // if (fs.existsSync("user_ans/"+allusers[i].userid+"_quiz.json")) {
	 if (allKeys["user_ans/"+allusers[i].userid+"_quiz.json"]) {
		//file exists
		allusers[i].exam_status="Appeared";
	  }
	  else
	  {
		allusers[i].exam_status="Not Appeared";  
	  }
	} catch(err) {
		console.log(err);
		allusers[i].exam_status = "Unknown";
	}
}

  //var readQuiz = fs.readFileSync('user_ans/'+req.body.qpid+'_quiz.json', 'utf8');
  res.send(JSON.stringify(allusers));
});

app.post('/getanswersheet', (req, res)=>{
   console.log(req.body);
//provide api if individual answers are to be updated
//lookup req.body.id in our records
//pull answersheet if exist
//update answer
  //var filename='kbre/user_ans/'+req.body.qpid+'_quiz.json';
	
  var readQuiz = fs.readFileSync('user_ans/'+req.body.qpid+'_quiz.json', 'utf8');
  res.send(readQuiz);
});

app.post('/saveanswersheet', (req, res)=>{
   console.log(req.body.qpid);
   //console.log(req.body);
   //load quiz responses
   req.body.quiztaker.review_ended_on=Date.now();
   var jsonString = JSON.stringify(req.body);
   fs.writeFile('reviewed/'+req.body.quiztaker.userid+'_quiz.json', jsonString, function (err) {
	  if (err) throw err;
	  console.log('Reviewed answersheet saved at reviewed/'+req.body.quiztaker.userid+'_quiz.json!');
  });
  
  //set the score on userAgent
  var totalScore = req.body.quiztaker.total_score
  //time taken
  var secondsDifference = Math.floor((Number.parseInt(req.body.quiztaker.exam_ended_on)-Number.parseInt(req.body.quiztaker.exam_started_on))/1000);
  var users = JSON.parse(fs.readFileSync("data/users.json", 'utf8'));
  for(var i=0;i<users.length;i++)
  {
	  if(users[i].userid== req.body.quiztaker.userid)
	  {
		  users[i].totalpoints=req.body.quiztaker.total_score;
		  users[i].timetaken=secondsDifference;
	  }
  }
  var jsonString = JSON.stringify(users);
	  fs.writeFile("data/users.json", jsonString, function (err) {
	  if (err) throw err;
	  console.log('user.json Updated!');
  });
    
  var filename='kbre/reviewedqa/'+req.body.quiztaker.userid+'_quiz.json'
       const params = {
         Bucket: 'chaanakya', // pass your bucket name
         Key: filename, // file will be saved as testBucket/contacts.csv
         Body: JSON.stringify(req.body)
     };
     s3.upload(params, function(s3Err, data) {
         if(s3Err) console.log(s3Err, s3Err.stack); // an error occurred
   	 else     console.log(data);           // successful response
         //console.log(`File uploaded successfully at ${data.Location}`)
     });
  res.send("Saved successfully!");
  
});

app.post('/getmyquiz', (req, res)=>{
   console.log(req.body);
//provide api if individual answers are to be updated
//lookup req.body.id in our records
//pull answersheet if exist
//update answer

  var readQuiz = fs.readFileSync('userq/'+req.body.userid+'_'+req.body.session+'_quiz.json', 'utf8');
  res.send(readQuiz);
});

app.post('/submitmyquiz', (req, res)=>{
   //console.log(req.body);
   //load quiz responses
   req.body.quiztaker.exam_ended_on=Date.now();
   var jsonString = JSON.stringify(req.body);
   fs.writeFile('user_ans/'+req.body.quiztaker.userid+'_quiz.json', jsonString, function (err) {
	  if (err) throw err;
	  console.log('Submitted answers saved at user_ans/'+req.body.quiztaker.userid+'_quiz.json!');
  });
	
  //save to s3
  var filename='kbre/user_ans/'+req.body.quiztaker.userid+'_quiz.json'
       const params = {
         Bucket: 'chaanakya', // pass your bucket name
         Key: filename, // file will be saved as testBucket/contacts.csv
         Body: JSON.stringify(req.body)
     };
     s3.upload(params, function(s3Err, data) {
         if(s3Err) console.log(s3Err, s3Err.stack); // an error occurred
   	 else     console.log(data);           // successful response
         //console.log(`File uploaded successfully at ${data.Location}`)
     });
  res.send("Submitted successfully!");
});

var server = app.listen(process.env.PORT || 4000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('KBRE app listening at http://%s:%s', host, port);
});

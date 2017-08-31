/*
 * Sample node.js code for AWS Lambda to get Apache log files from S3, parse
 * and add them to an Amazon Elasticsearch Service domain.
 *
 *
 * Copyright 2015- Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at http://aws.amazon.com/asl/
 * or in the "license" file accompanying this file.  This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * express or implied.  See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* Imports */
var AWS = require('aws-sdk');
var Elasticsearch = require('aws-es');
/* Globals */
var elasticsearch = new Elasticsearch({
		accessKeyId: '[your-access-key]',
		secretAccessKey: '[your-secret-access-key]',
		service: 'es',
		region: 'us-west-2',
		host: 'search-qacelasticrepo-kyotxaszaawzpupboj3xpgoi7m.us-west-2.es.amazonaws.com'
	});


var s3 = new AWS.S3();
var numDocsAdded = 0;   // Number of log lines added to ES so far

/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that permits ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');

/*
 * Get the log file from the given S3 bucket and key.  Parse it and add
 * each log record to the ES domain.
 */
function s3LogsToES(bucket, key, context, lineStream, recordStream) {
    // Note: The Lambda function should be configured to filter for .log files
    // (as part of the Event Source "suffix" setting).

    var s3Stream = s3.getObject({Bucket: bucket, Key: key}).createReadStream();

    // Flow: S3 file stream -> Log Line stream -> Log Record stream -> ES
    
	postDocumentToES(key, context);
      

    s3Stream.on('error', function() {

        console.log(
            'Error getting object "' + key + '" from bucket "' + bucket + '".  ' +
            'Make sure they exist and your bucket is in the same region as this function.');
        context.fail();
    });
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

/*
 * Determine the document type, and index it to suit the type.
 */
function determineDocType(type) {
	
	console.log("Type: " + type);
	
	if (type == 'jpg' || type == 'jpeg' || type == 'png' || type == 'bmp') {
		esindex = 'images';
	}
	else if (type == 'mp4' || type == 'wmv' || type == 'avi' || type == 'mov') {
		esindex = "videos";
	}
	else if (type == 'log') {
		esindex = 'logs';
	}
	else if (type == '7z' || type == 'rar' || type == 'zip' || type == 'pkg' || type == 'rpm' || type == 'tar') {
		esindex = 'compressed';
	}
	else if (type == 'pdf' || type == 'docx' || type == 'doc' || type == 'txt' || type == 'rtf') {
		esindex = 'documents';
	}
	else if (type == 'mp3' || type == 'wav' || type == 'aac' || type == 'aif' || type == 'cda' || type == 'mid' || type == 'midi' || type == 'wma'){
		esindex = 'sounds';
	}
	else if (type == 'xlsx' || type == 'xls' || type == 'csv' || type == 'sql' || type == 'xml' || type == 'tar' || type == 'db' || type == 'dbf') {
		esindex = 'databases';
	}
	else if (type == 'bin' || type == 'exe' || type == 'jar' || type == 'py' || type == 'com' || type == 'bat') {
		esindex = 'executables';
	}
	else {
		esindex = 'other';
	}
	return esindex;
}	

/*
 * Add the given document to the ES domain.
 * If all records are successfully added, indicate success to lambda
 * (using the "context" parameter).
 */
function postDocumentToES(key, context) {
    
	var docName = key.split(/\/|\./g);
	
	type = docName[docName.length - 1];
	title = replaceAll(key, "/", "-");
	index = determineDocType(type);
	
	if (type == 'gz') {
		type = docName[docName.length - 2] + "." + docName[docName.length - 1];
		index = "compressed";
	}
	
	console.log("key: " + key);
	console.log("title: " + title);
	
	elasticsearch.delete({
			index: index,
			type: type,
			id: title,			
		}, 
		function(err, data) {
			console.log('json reply received');
        });
	
}

/* Lambda "main": Execution starts here */
exports.handler = function(event, context) {
    console.log('Received event: ', JSON.stringify(event, null, 2));
    
    /* == Streams ==
    * To avoid loading an entire (typically large) log file into memory,
    * this is implemented as a pipeline of filters, streaming log data
    * from S3 to ES.
    * Flow: S3 file stream -> Log Line stream -> Log Record stream -> ES
    */

	
	
    event.Records.forEach(function(record) {
		console.log("RECORD: " + record);
        var bucket = record.s3.bucket.name;
        var objKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        s3LogsToES(bucket, objKey, context);
    });
}

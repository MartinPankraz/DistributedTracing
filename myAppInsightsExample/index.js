const config = require('./config.js');
const https = require('https');
const appInsights = require("applicationinsights");
appInsights.setup(config.appInsights)
.setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(false)
    .start();
//Names for Azure AppInsights application map
appInsights.defaultClient.addTelemetryProcessor(envelope => {
    envelope.tags["ai.cloud.role"] = "myappinaws";
    envelope.tags["ai.cloud.roleInstance"] = "myawsapp-1"
});

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
exports.handler = (event, context, callback) => {
    var myCode = escape(event.code);
    var myName = event.name;
    var params = {
                    host: "az-forwarder.azurewebsites.net",
                    path: "/api/HttpTrigger1?code="+ myCode +"&name="+myName,
                    method: 'POST'
                    };
                    
                    
    const req = https.request(params, (res) => {
        let body = '';
        console.log('Status:', res.statusCode);
        //console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            // If we know it's JSON, parse it
            if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body);
            }
            //callback(null, JSON.stringify(body));
            let client = appInsights.defaultClient;
    
            let customMetric = Math.random() * 50 + 50;
            client.trackMetric({name: "AWS Test", value: customMetric, tagOverrides:{"ai.operation.id": context.invocationId}});
            client.trackEvent({ name: "Custom AWS event", properties: { customProperty: "my custom event" }, tagOverrides:{"ai.operation.id": context.invocationId} });
            client.trackDependency({target:"http://dbname", name:"select customers proc", data:"SELECT * FROM Customers", duration:231, resultCode:0, success: true, dependencyTypeName: "ZSQL", tagOverrides:{"ai.operation.id": context.invocationId}});
            //format response in a way that AWS API Gateway can understand!
            const response = {"statusCode": 200, "body": JSON.stringify({"response":"from AWS Lambda :-)"}),
                "isBase64Encoded": false };
            //client.flush({callback: () => {
                callback(null, response);
            //}});
        });
    });
    req.on('error', callback);
    req.write("{'data': 'from AWS'}");
    req.end();
    
};
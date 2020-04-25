const appInsights = require("applicationinsights");
const config = require('./config.js');
const https = require('https');
appInsights.setup(config.appInsights).setUseDiskRetryCaching(false).setInternalLogging(true, true).start();

//Names for Azure AppInsights application map
appInsights.defaultClient.addTelemetryProcessor(envelope => {
    envelope.tags["ai.cloud.role"] = "my-app-in-aws";
    envelope.tags["ai.cloud.roleInstance"] = "my-aws-app-1"
});

// Helper for wrapping handlers with Applcation Insights tracking
function wrapHandler(name, origHandler) {
    const CorrelationContextManager = require('applicationinsights/out/AutoCollection/CorrelationContextManager').CorrelationContextManager;
    const Util = require('applicationinsights/out/Library/Util');

    const wrappedHandler = (origEvent, origContext, origCallback) => {
        const startTime = new Date(); // Used to calculate duration
        const operationId = Util.w3cTraceId();
        const requestId = '|' + operationId + '.0';

        // Wrap callback with request and exception telemetry
        const wrappedCallback = (error, response) => {
            const duration = new Date().getTime() - startTime.getTime();
            if (error) {
                appInsights.defaultClient.trackException({exception: error});
            }
            appInsights.defaultClient.trackRequest({
                duration: duration,
                name: name,
                success: !error,
                resultCode: !error ? 200 : 500,
                url: '',
                id: requestId
            });
            let customMetric = Math.random() * 50 + 50;
            appInsights.defaultClient.trackMetric({name: "AWS Test", value: customMetric});
            appInsights.defaultClient.trackEvent({ name: "Custom AWS event", properties: { customProperty: "my custom event" } });
            appInsights.defaultClient.trackDependency({target:"http://dbname", name:"select customers proc", data:"SELECT * FROM Customers", duration:231, resultCode:0, success: true, dependencyTypeName: "ZSQL"});
            //format response in a way that AWS API Gateway can understand!
            appInsights.defaultClient.flush({callback: _=> {
                origCallback(error, response);
            }});
        };

        // Run the original handler inside correlation context
        // Necessary because automatic context creation requires incoming HTTP
        const correlationContext = CorrelationContextManager.generateContextObject(
            operationId,
            requestId,
            name
        );
        CorrelationContextManager.runWithContext(correlationContext, () =>
            origHandler(origEvent, origContext, wrappedCallback));
    };
    return wrappedHandler;
}

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
exports.handler = wrapHandler("MyFunction", (event, context, callback) => {
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
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            // If we know it's JSON, parse it
            if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body);
            }
            callback(null, JSON.stringify(body));
        });
    });
    req.on('error', callback);
    req.write("{'data': 'from AWS'}");
    req.end();
    
});
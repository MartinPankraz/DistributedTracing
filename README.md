# DistributedTracing
Example for distributed tracing with serverless and Application Insights

Community blog post: https://blogs.sap.com/2020/04/19/embrace-multi-cloud-or-how-to-climb-down-the-distributed-troubleshooting-rabbit-hole/

## Prerequisites
- Create an Azure Function with Application Insights and mark the instrumentation key for later
- Have a look at the Azure Application Insights for Nodejs docs for config details: https://docs.microsoft.com/en-us/azure/azure-monitor/app/nodejs
- create config.js file containing your Azure Application Insights Instrumentation Key
- create zip file of project (containing node_modules, config.js and index.js file)
- Setup AWS Lambda and upload the zip file

Feel free to reach out: martin.pankraz@microsoft.com

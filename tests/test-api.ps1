# Test Chatbot API
$body = @{
    message = "माझ्या भातावर पिवळे ठिपके दिसत आहेत"
    language = "mr"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://10.232.236.239:5001/api/chatbot/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing

Write-Host "Chatbot Response:"
$response.Content

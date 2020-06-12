# discordbot (name tbd)

## Requirements

### External Libraries

### API Keys

#### [Discord Bot Token](https://discord.com/developers/applications) [Required]
`discord_token` - Required for the bot to login and communicate to discord.  

#### [Youtube Search API Token](https://developers.google.com/youtube/v3) [Required]
`youtube_api_token` - Required for the bot to search for song URLs 
(Hopefully this will be converted to a scraper)

#### Google Cloud
GCP can be used for both [Speech-to-Text](https://cloud.google.com/speech-to-text) and 
[Text-to-Speech](https://cloud.google.com/text-to-speech)

`google_project_id` - 

`google_keyFileName` - 

#### IBM Watson
IBM Watson can be used for both [Speech-to-Text](https://www.ibm.com/cloud/watson-speech-to-text#:~:text=Watson%20Speech%20to%20Text%20is,recognition%20for%20optimal%20text%20transcription.) and 
[Text-to-Speech](https://www.ibm.com/ca-en/marketplace/watson-text-to-speech)

`watson_token` - 

`watson_url` - 

#### Microsoft Azure
Microsoft Azure can be used for both [Speech-to-Text](https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/) and
[Text-to-Speech](https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/)

`microsoft_token` - 

`microsoft_location` - 

## Setup

### Heroku

### Docker

`docker build --build-arg git_token=<token> -t <container_name> --no-cache .`

`docker run --name=<name>--env-file=keys <container_name>`

## Features

## Optional Features


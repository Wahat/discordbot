const search = require('youtube-search')
const keys = require('./keys.js').Key

const options = {
    maxResults: 1,
    key: keys.get("youtube_api_token"),
    type: 'video',
    relevanceLanguage: `en`,
    regionCode: 'CA',
}

/**
 * Given a search string, find the most relevant youtube video.
 * @param {string} input
 * @returns {Promise<string>}
 */
async function searchYoutube(input) {
    if (doesInputContainsUrl(input)) {
        return input
    }
    return new Promise((resolve) => {
        search(input, options, (err, results) => {
            if (err) {
                console.log(err);
                resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            }
            console.log(`Found ${results[0].title}, Link ${results[0].link}`)
            resolve(results[0].link)
        })
    })
}

/**
 *
 * @param {string} input
 * @returns {boolean}
 */
function doesInputContainsUrl(input) {
    return input.includes("youtube.com")
}

module.exports.searchYoutube = searchYoutube
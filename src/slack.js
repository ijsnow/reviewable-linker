const bunyan = require('bunyan')
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const _ = require('lodash')

const commandParser = require('./commandParser.js')
const validateInput = require('./validateInput.js')

const logger = bunyan.createLogger({name: 'reviewable-linker'})
const slackToken = process.env.SLACK_TOKEN || '';

if (!slackToken) {
    logger.error('missing environment variable SLACK_TOKEN')
    process.exit(1)
}

const rtm = new RtmClient(slackToken);

const connect = () => {
    let channel

    // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
        for (const c of rtmStartData.channels) {
            if (c.is_member) { channel = c.id }
        }
        logger.info(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
    })

    // you need to wait for the client to fully connect before you can send messages
    rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
        logger.info('Connection opened')
    })

    rtm.start()

    rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
        let results = commandParser(message)
        results = validateInput(results)
        if (!_.isEmpty(results)) {
            logger.info(results)
        }
      })
}

module.exports = connect
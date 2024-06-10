const { ActivityHandler, MessageFactory } = require('botbuilder');
const axios = require('axios');
const https = require('https');

// 環境変数からAzureOpenAIの接続情報を取得
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME;
const VERSION = process.env.VERSION;
const OPENAI_COMPLETION_URL = process.env.OPENAI_COMPLETION_URL;
const API_KEY = process.env.API_KEY;


// HTTPSエージェントの設定
const agent = new https.Agent({  
    rejectUnauthorized: false
  });


var getCompletion = async function (text) {
    var data = {
        messages: [
            {
                "role": "user", 
                "content": text
            }
        ]
    };
    var res = await axios({
        method: 'post',
        url: OPENAI_COMPLETION_URL,
        headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY
        },
        data: data,
        httpsAgent: agent // カスタムエージェントを使用
    });
    return (res.data.choices[0] || []).message?.content;
};

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // const replyText = `Echo: ${ context.activity.text }`;
            // await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            try{
                const replyText = await getCompletion(context.activity.text);
                await context.sendActivity(replyText);
            } catch (e) {
                console.log(e);
            }
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;

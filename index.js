/**
 * Load environment variables
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const spamLibrary = require('./antispam/spam-library');
const checkForSpam = require('./antispam/check-for-spam');

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
let botInfo = {};

bot.on('polling_error', function(error){ console.log(error); });

(async () => {
    try {
        botInfo = await bot.getMe();
    } catch (e) {
        console.log(e);
    }
})();

const isGroupChat = (msg) => {
    return ['group', 'supergroup'].includes(msg.chat.type);
}

/**
 * Check if we need to remove and ignore user's message
 *
 * Returns false if message is ok
 */
const doesBotNeedToIgnoreMessage = async (msg, needToRemoveMessage = false) => {
    /**
     * Allow to use in private messages
     */
    if (['private'].includes(msg.chat.type)) return;

    /**
     * if bot has admin rights then
     * - allow messages only from admins
     * - remove all other messages
     *
     * if bot is a user in a group then it should process everything
     */
    if (isGroupChat(msg)) {
        const adminsList = await bot.getChatAdministrators(msg.chat.id);
        const adminIds = adminsList.map(admin => {
            return admin.user.id;
        })

        /**
         * Check if bot is admin
         */
        if (adminIds.includes(botInfo.id)) {
            /**
             * If the message from an admin then ok
             */
            if (adminIds.includes(msg.from.id)) {
                return;
            }

            /**
             * If the message from the regular user then check
             * to remove it and then do nothing
             */
            if (needToRemoveMessage) {
                try {
                  await bot.deleteMessage(msg.chat.id, msg.message_id);
                } catch (e) {
                  console.log(e);
                }
            }

            /**
             * Skip message processing
             */
            return true;
        }
    }
}

bot.on('text', async (msg) => {
    // console.log(msg);

    try {
        const isSpam = checkForSpam(msg, spamLibrary);

        if (isSpam) {
            const options = {};

            if (msg.is_topic_message) {
                options.message_thread_id = msg.message_thread_id
            }

            await bot.forwardMessage(process.env.ADMIN_CHAT_ID, msg.chat.id, msg.message_id);
            
            try {
                await bot.deleteMessage(msg.chat.id, msg.message_id);

                await bot.sendMessage(msg.chat.id, 'Я удалил сообщение, которое было похоже на спам.', {
                    ...options
                });
            } catch (e) {
                await bot.sendMessage(msg.chat.id, 'Похоже на спам, но у меня не хватает прав удалить сообщение.', {
                    reply_to_message_id: msg.message_id,
                    ...options
                });
            }
            
            return;
        }
    } catch (e) {
        console.log('[ANTISPAM] error:', e);
    }
});

bot.onText(/\/spam/, async (msg) => {
    try {
        if (await doesBotNeedToIgnoreMessage(msg, true)) return;

        const replyMessage = msg.reply_to_message;

        const options = {};
        if (msg.is_topic_message) {
            options.message_thread_id = msg.message_thread_id
        }

        if (replyMessage && replyMessage.text) {
            const text = replyMessage.text;

            // send message to admin for review
            await bot.forwardMessage(process.env.ADMIN_CHAT_ID, msg.chat.id, replyMessage.message_id);
            await bot.sendMessage(process.env.ADMIN_CHAT_ID, "👆 Помечено как спам");

            // reply to user
            await bot.sendMessage(msg.chat.id, `Спасибо, присмотрюсь к таким сообщениям внимательнее.`, {
                reply_to_message_id: replyMessage.message_id,
                ...options
            });

            // delete marked message
            await bot.deleteMessage(msg.chat.id, replyMessage.message_id);

            // ban user
            await bot.banChatMember(msg.chat.id, replyMessage.from.id)
        }

        // delete message with command
        await bot.deleteMessage(msg.chat.id, msg.message_id);
    } catch (e) {}
});
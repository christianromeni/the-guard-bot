'use strict';

const { Markup } = require('telegraf');

// Bot
const { replyOptions } = require('../../bot/options');

// DB
const { isAdmin } = require('../../stores/user');
const {
	getCommand,
	removeCommand,
	updateCommand
} = require('../../stores/command');

const addCustomCmdHandler = async ({ chat, message, reply }, next) => {
	const { text, photo, document, video, audio } = message;
	const { id } = message.from;

	if (text && /^\/\w+/.test(text)) {
		await removeCommand({ id, isActive: false });
		return next();
	}

	const command = await getCommand({ id, isActive: false });
	if (chat.type !== 'private' ||
		!await isAdmin(message.from) ||
		!command ||
		!command.state) {
		return next();
	}

	const { state } = command;
	if (state === 'add') {
		if (!/^(?=\D)\w+$/.test(text)) {
			reply('Please send a valid command.');
			return next();
		}
		if (await getCommand({ isActive: true, name: text })) {
			reply(
				'ℹ️ <b>This command already exists.</b>\n\n' +
				'/commands - to see the list of commands.\n' +
				'/addcommand - to add a command.\n' +
				'/removecommand <code>&lt;name&gt;</code>' +
				' - to remove a command.',
				replyOptions);
			return next();
		}
		await updateCommand({ id, name: text, state: 'role' });
		reply('Who can use this command?', Markup.keyboard([
			[ 'Master', 'Admins', 'Everyone' ]
		])
			.oneTime()
			.resize()
			.extra());
		return next();
	}

	if (state === 'role') {
		if (text !== 'Master' && text !== 'Admins' && text !== 'Everyone') {
			reply('Please send a valid role.', Markup.keyboard([
				[ 'Master', 'Admins', 'Everyone' ]
			])
				.oneTime()
				.resize()
				.extra());
			return next();
		}
		await updateCommand({ id, role: text, state: 'content' });
		reply(
			'Send the content you wish to be shown when the command is used.' +
			'.\n\nSupported contents:\n- <b>Text (HTML)</b>\n- <b>Photo</b>' +
			'\n- <b>Video</b>\n- <b>Document</b>\n- <b>Audio</b>',
			replyOptions);
		return next();
	}

	if (state === 'content') {
		let newCommand;
		if (text) {
			newCommand = { content: text, type: 'text' };
		}
		if (photo) {
			newCommand = {
				content: photo[photo.length - 1].file_id,
				type: 'photo'
			};
		}
		if (document) {
			newCommand = { content: document.file_id, type: 'document' };
		}
		if (video) {
			newCommand = { content: video.file_id, type: 'video' };
		}
		if (audio) {
			newCommand = { content: audio.file_id, type: 'audio' };
		}
		if (message.caption) {
			newCommand.caption = message.caption;
		}
		await Promise.all([
			updateCommand(Object.assign(
				{},
				newCommand,
				{ id, isActive: true, state: null })),
		]);
		reply(
			'✅ <b>New command has been created successfully.</b>\n\n' +
			'This command can be used in groups now. ' +
			'Custom commands can reply other messages too.\n\n' +
			'/commands - to see the list of commands.\n' +
			'/addcommand - to add a new command.\n' +
			'/removecomand <code>&lt;name&gt;</code> - to remove a command.',
			replyOptions);
		return next();
	}
	return next();
};

module.exports = addCustomCmdHandler;
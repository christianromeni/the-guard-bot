// @ts-check
'use strict';

const dedent = require('dedent-js');

const { context } = require('../bot');
const { escapeHtml, link } = require('../utils/tg');
const { isWarnNotExpired } = require('../utils/config');
const { numberOfWarnsToBan } = require('../utils/config').config;
const { warn } = require('../stores/user');
const ban = require('./ban');


const cmp = (a, b) => Math.sign(a - b);

module.exports = async ({ admin, amend, reason, userToWarn }) => {
	const by_id = admin.id;
	const date = new Date();

	const { warns } = await warn(
		userToWarn,
		{ by_id, date, reason },
		{ amend },
	);

	const recentWarns = warns.filter(isWarnNotExpired(date));

	const count = {
		'-1': recentWarns.length + '/' + numberOfWarnsToBan,
		0: `${recentWarns.length}/${numberOfWarnsToBan}, <b>last warning!</b>`,
		1: `<b>banned</b> for receiving ${numberOfWarnsToBan} warnings!`,
	}[cmp(recentWarns.length + 1, numberOfWarnsToBan)];

	const warnMessage = dedent(`
		⚠️ ${admin.first_name} <b>warned</b> ${link(userToWarn)} <b>for</b>:

		${escapeHtml(reason)} (${count})`);

	if (recentWarns.length >= numberOfWarnsToBan) {
		await ban({
			admin: context.botInfo,
			reason: 'Reached max number of warnings',
			userToBan: userToWarn,
		});
	}

	return warnMessage;
};

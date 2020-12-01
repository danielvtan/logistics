"use stict";

const uuid = require('uuid');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const dyno = require('dyno');
const db = dyno({
	table: process.env.usersTable,
	region: process.env.region
});

module.exports.handler = (event, context, cb) => {
	let params, id;

	switch(event.method) {
		case "POST":
			params = event.body;
			create(params).then((data) => {
				return cb(null, data);
			}).catch((err) => {
				return cb(new Error('[400] ' + err));
			});
		break;
		/*
		case "GET":
			id = event.path.id;
			user.get(id).then((data) => {
				return cb(null, data);
			}).catch((err) => {
				return cb(new Error('[400] ' + err));
			});
		break;
		case "PUT":
			id = event.path.id;
			params = event.body;
			user.update(id, params).then((data) => {
				return cb(null, data);
			}).catch((err) => {
				return cb(new Error('[400] ' + err));
			})
		break;
		case "DELETE":
			id = event.path.id;
			user.delete(id).then((data) => {
				return cb(null, data);
			}).catch((err) => {
				return cb(new Error('[400] ' + err));
			});
		break;
		*/
	}
};

const create =(params)=> {
	return new Promise((resolve, reject) => {
		return checkEmail(params.email, null).then((data) => {
			insert(params);
		}).catch((err) => { 
			reject(err)
		});
	});
}
const checkEmail =(email, id)=> {
	const db_params = {
		IndexName: "email-index",
		KeyConditionExpression: "email = :e",
		ExpressionAttributeValues: { ":e": email },
		ProjectionExpression: ["email", "id"]
	};

	return new Promise((resolve, reject) => {
		db.query(db_params, (err, data) => {
			if (id !== null) {
				const dataCount = data.Count >= 1
				if (err || dataCount && data.Items[0].email === email && data.Items[0].id !== id) {
					reject(err || 'Email already exists');
				} else {
					resolve();
				}
			} else {
				if (err || data.Items[0]) reject(err || 'Email already exists');
				else resolve();
			}
		});
	});
}
const insert =(params)=> {
	let db_params = {
		Item: {
			id: uuid.v1(),
			date_created: moment().format('MM/DD/YYYY hh:mma'),
			date_updated: 0,
			last_login: 0
		}
	};

	db_params.Item = Object.assign(db_params.Item, params);

	return new Promise((resolve, reject) => {
		return hashPassword(params.password).then((hash) => {
			db_params.Item.password = hash;
			db.putItem(db_params, (err, data) => {
				if (err) reject(err);
				else resolve(db_params.Item);
			});
		});
	});
}
const hashPassword =(secret)=> {
	return new Promise((resolve, reject) => {
		bcrypt.hash(secret, 10, (err, hash) => {
			if (err) reject(err);
			else resolve(hash);
		});
	});
}
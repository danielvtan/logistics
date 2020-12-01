'use strict';

const dyno = require('dyno');
const db = dyno({
    table: process.env.sessionTable,
    region: process.env.region
});

const moment = require('moment');

module.exports.handler = (event, context, cb) => {
  const resources = process.env.apiArn;
  validateToken(event.authorizationToken)
    .then((principalId) => {
      return generatePolicy(event.authorizationToken, 'Allow', resources);
    }).catch((err) => {
      return generatePolicy(event.authorizationToken, 'Deny', resources);
    }).then((policy) => {
      cb(null, policy);
    });
};

const generatePolicy = (principalId, effect, resource) => {
  const policy = {
    'principalId': principalId,
    'policyDocument': {
      'Version': '2012-10-17',
        'Statement': [{
          'Action': 'execute-api:Invoke',
          'Effect': effect,
          'Resource': resource
        }]
      }
  };
  return Promise.resolve(policy);
};

const validateToken = (token) => {
  const params = {
    Key: { token: token },
    UpdateExpression: "set expiration = :e",
    ConditionExpression: "#t = :t AND expiration > :n",
    ExpressionAttributeNames: {
      "#t": "token"
    },
    ExpressionAttributeValues: {
      ":e": moment().add(15, "minutes").unix(),
      ":t": token,
      ":n": moment().unix()
    }
  };
  return new Promise((resolve, reject) => {
    db.updateItem(params, (err) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
};
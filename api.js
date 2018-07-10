"use strict"

const AWS = require('aws-sdk')

let dynamodb = null

const table = 'CATALOG';

const Catalog = {
  TableName : "CATALOG",
  KeySchema: [       
    { AttributeName: "catalogId", KeyType: "HASH" }
  ],
  AttributeDefinitions: [       
    { AttributeName: "catalogId", AttributeType: "S" }
  ],
  ProvisionedThroughput: {       
      ReadCapacityUnits: 1, 
      WriteCapacityUnits: 1
  }
}

const db = {
  _ready: false,

  createTable(done) {
    if (!this._ready) {
      console.error("DynamoDB is not ready yet")
      return this;
    }

    dynamodb.createTable(Catalog, function(err, data) {
      if (err) {
        done && done(err);
      } else {
        done && done();
      }
    });

    return this;
  },

  dropTable(done) {
    if (!this._ready) {
      console.error("DynamoDB is not ready yet")
      return this;
    }
    dynamodb.deleteTable({ TableName: table }, done)
  },

  getCatalog({ catalogId }, done) {

    if (!catalogId) {
      done && done({error: 'must specify catalogId'}, null)
      return
    }
    
    const params = { 
      TableName: table, 
      Key: {
        "catalogId": catalogId
      }
    }
    const docClient = new AWS.DynamoDB.DocumentClient();
    docClient.get(params, function(err, data) {
      if (err) {
        done && done({ error:`Unable to read item: ${JSON.stringify(err, null, 2)}`}, null);
      } else {
        if (data && data.Item) {
          done && done(null, data.Item);
        } else {
          done && done(null, null);
        }
      }
    });

  },

  createCatalog( {uid, catalog}, done) {

    if (!uid) {
      done && done({error: 'require user id'}, null)
    }

    if (!catalog) {
      done && done({error: 'empty data'}, null)
    }

    if (!catalog.catalogId) {
      done && done({error: 'missing catalogId'}, null)
    }

    if (!catalog.detail) {
      catalog.detail = {
        createdBy: uid
      };
    }

    if (!catalog.courses) {
      catalog.courses = {};
    }

    const now = new Date();
    catalog.detail.createdAt = now.getTime();

    const params = {
      TableName: table,
      Item: catalog
    };
    
    const docClient = new AWS.DynamoDB.DocumentClient();
    docClient.put(params, (err, data) => {
      if (err) {
        done && done(err);
      } else {
        done && done();
      }
    });
  },

  removeCatalog({courseId}, done) {

  },

}

function DynamoDB({ region = 'us-west-2', endpoint = 'http://localhost:8000' }, onReady) {
 
  AWS.config.update({ region, endpoint });
 
  dynamodb = new AWS.DynamoDB();

  if (onReady) {
    dynamodb.listTables(function (err, data) {
      if (err) {
        console.log("Error when checking DynamoDB status")
        db._ready = false;
        onReady(err, null);
      } else {
        db._ready = true;
        onReady(null, data);
      }
    });
  } else {
    db._ready = true;
  }

  return db;

}

module.exports = DynamoDB;


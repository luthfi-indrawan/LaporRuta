const BaseModel = require("./BaseModel");

class CommentsModel extends BaseModel {
  constructor() {
    super("comments");
  }
}

module.exports = new CommentsModel();

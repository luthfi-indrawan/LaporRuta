const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }
}

module.exports = new UserModel();

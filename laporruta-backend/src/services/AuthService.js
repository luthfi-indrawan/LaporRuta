const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserModel = require("../models/UserModel");
const db = require("../config/database");
const httpStatus = require("../constants/httpStatus");
const roles = require("../constants/role");

class AuthService {
  constructor() {
    this.userModel = UserModel;
    this.db = db;
  }

  // Register
  async register(data) {
    const { full_name, email, password } = data;

    // 1. Cek email duplikat
    const existing = await this.userModel.findByEmail(email);
    if (existing) {
      const err = new Error("Email sudah terdaftar");
      err.statusCode = httpStatus.CONFLICT;
      throw err;
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 3. Insert user (role default 'user')
    const user = await this.userModel.create({
      full_name,
      email: email.toLowerCase(),
      password_hash,
      role: roles.User,
      is_active: true,
    });

    // 4. Generate token pair
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(db, user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // Login
  async login(data) {
    const { email, password } = data;

    const user = await this.userModel.findByEmail(email);
    if (!user) {
      const err = new Error("Kredensial tidak valid");
      err.statusCode = httpStatus.UNAUTHORIZED;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error("Kredensial tidak valid");
      err.statusCode = httpStatus.UNAUTHORIZED;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error("Akun dinonaktifkan");
      err.statusCode = httpStatus.FORBIDDEN;
      throw err;
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(db, user.id);

    return {
      user: this.sanitizeUser(user),
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // Refresh Token
  async refresh(refreshToken) {
    if (!refreshToken) {
      const err = new Error("Refresh token tidak ditemukan");
      err.statusCode = httpStatus.UNAUTHORIZED;
      throw err;
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const result = await this.db.query(
      `SELECT
        rt.id,
        rt.user_id,
        u.is_active,
        u.email,
        u.full_name,
        u.role,
        u.assigned_wilayah_id
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = $1
       AND rt.expires_at > NOW()`,
      [tokenHash],
    );

    const tokenRecord = result.rows[0];

    if (!tokenRecord) {
      const err = new Error("Refresh token tidak valid atau sudah kadaluarsa");
      err.statusCode = httpStatus.UNAUTHORIZED;
      throw err;
    }

    if (!tokenRecord.is_active) {
      const err = new Error("Akun dinonaktifkan");
      err.statusCode = httpStatus.FORBIDDEN;
      throw err;
    }

    const user = {
      id: tokenRecord.user_id,
      email: tokenRecord.email,
      full_name: tokenRecord.full_name,
      role: tokenRecord.role,
      assigned_wilayah_id: tokenRecord.assigned_wilayah_id,
      is_active: tokenRecord.is_active,
    };

    return await this.db.transaction(async (client) => {
      // Hapus refresh token lama
      await client.query("DELETE FROM refresh_tokens WHERE id = $1", [
        tokenRecord.id,
      ]);

      // Generate access token baru
      const accessToken = this.generateAccessToken(user);

      // Generate & simpan refresh token baru
      const newRefreshToken = await this.generateRefreshToken(client, user.id);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    });
  }

  // Logout
  async logout(refreshToken) {
    if (refreshToken) {
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      await this.db.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
        tokenHash,
      ]);
    }
    return true;
  }

  // Current User
  async me(userId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      const err = new Error("User tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }
    return this.sanitizeUser(user);
  }

  // Helpers
  generateAccessToken(user) {
    const jti = crypto.randomUUID(); // 128-bit unique ID

    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        assigned_wilayah_id: user.assigned_wilayah_id,
        jti,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256", // explicit lebih aman, cocok dengan JWT_SECRET
        expiresIn: "15m",
      },
    );
  }

  async generateRefreshToken(client, userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    return token;
  }

  sanitizeUser(user) {
    const { password_hash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();

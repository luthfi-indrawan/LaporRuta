const AuthService = require("../services/AuthService");
const ResponseHelper = require("../utils/ResponseHelper");

class AuthController {
  constructor() {
    this.service = AuthService;
    this.COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict", // ← case sesuai spec
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
  }

  async register(req, res, next) {
    try {
      const data = await this.service.register(req.body);
      res.cookie("refresh_token", data.refresh_token, this.COOKIE_OPTIONS);
      return ResponseHelper.success(
        res,
        { user: data.user, access_token: data.access_token },
        "registrasi berhasil",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const data = await this.service.login(req.body);
      res.cookie("refresh_token", data.refresh_token, this.COOKIE_OPTIONS);
      return ResponseHelper.success(
        res,
        { user: data.user, access_token: data.access_token },
        "login berhasil",
      );
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      const data = await this.service.refresh(refreshToken);
      res.cookie("refresh_token", data.refresh_token, this.COOKIE_OPTIONS);
      return ResponseHelper.success(
        res,
        { access_token: data.access_token },
        "token berhasil diperbarui",
      );
    } catch (error) {
      // ← hanya clear cookie kalau token memang invalid
      if (error.statusCode === 401 || error.statusCode === 403) {
        res.clearCookie("refresh_token", { path: "/" });
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    const refreshToken = req.cookies?.refresh_token;
    try {
      await this.service.logout(refreshToken);
    } catch (error) {
      // ← log saja, jangan block user logout
      console.error("Logout cleanup error:", error);
    }
    res.clearCookie("refresh_token", { path: "/" });
    return ResponseHelper.success(res, null, "logout berhasil");
  }

  async me(req, res, next) {
    try {
      const userId = req.user?.sub;
      const data = await this.service.me(userId);
      return ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

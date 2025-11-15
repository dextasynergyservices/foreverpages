"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signToken(payload, secret, opts) {
    return jsonwebtoken_1.default.sign(payload, secret, { algorithm: "HS256", expiresIn: "1h", ...(opts || {}) });
}
function verifyToken(token, secret) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret, { algorithms: ["HS256"] });
        return decoded;
    }
    catch {
        return null;
    }
}

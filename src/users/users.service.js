"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(prisma) {
            this.prisma = prisma;
        }
        UsersService_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.findMany({
                            orderBy: {
                                createdAt: 'desc',
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.createMockUser = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.user.create({
                            data: {
                                telegramId: Date.now().toString(),
                                username: "user_".concat(Math.floor(Math.random() * 10000)),
                                firstName: 'Test',
                                lastName: 'User',
                            },
                        })];
                });
            });
        };
        UsersService_1.prototype.getProfile = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, openings, totalWonTon, totalSoldTon, mostExpensiveOpening, activeInventory;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { id: userId },
                                select: {
                                    id: true,
                                    telegramId: true,
                                    username: true,
                                    firstName: true,
                                    lastName: true,
                                    photoUrl: true,
                                    tonWalletAddress: true,
                                    tonWalletNetwork: true,
                                    tonWalletConnectedAt: true,
                                },
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            return [4 /*yield*/, this.prisma.caseOpening.findMany({
                                    where: {
                                        userId: userId,
                                    },
                                    include: {
                                        case: true,
                                        giftType: true,
                                    },
                                    orderBy: {
                                        createdAt: 'desc',
                                    },
                                })];
                        case 2:
                            openings = _a.sent();
                            totalWonTon = openings.reduce(function (sum, opening) { return sum + opening.giftType.estimatedValueTon; }, 0);
                            totalSoldTon = openings.reduce(function (sum, opening) { var _a; return sum + ((_a = opening.soldAmountTon) !== null && _a !== void 0 ? _a : 0); }, 0);
                            mostExpensiveOpening = openings.reduce(function (highest, opening) {
                                if (!highest) {
                                    return opening;
                                }
                                return opening.giftType.estimatedValueTon >
                                    highest.giftType.estimatedValueTon
                                    ? opening
                                    : highest;
                            }, null);
                            activeInventory = openings.filter(function (opening) { return opening.status === client_1.CaseOpeningStatus.OWNED; });
                            return [2 /*return*/, {
                                    user: user,
                                    summary: {
                                        totalWonTon: totalWonTon,
                                        totalItemsWon: openings.length,
                                        activeInventoryCount: activeInventory.length,
                                        totalSoldTon: totalSoldTon,
                                        mostExpensiveGift: mostExpensiveOpening
                                            ? this.mapInventoryItem(mostExpensiveOpening)
                                            : null,
                                    },
                                    inventory: activeInventory.map(function (opening) { return _this.mapInventoryItem(opening); }),
                                    openingHistory: openings.map(function (opening) { return _this.mapHistoryEntry(opening); }),
                                }];
                    }
                });
            });
        };
        UsersService_1.prototype.getInventoryItem = function (userId, openingId) {
            return __awaiter(this, void 0, void 0, function () {
                var opening;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseOpening.findFirst({
                                where: {
                                    id: openingId,
                                    userId: userId,
                                },
                                include: {
                                    case: true,
                                    giftType: true,
                                },
                            })];
                        case 1:
                            opening = _a.sent();
                            if (!opening) {
                                throw new common_1.NotFoundException('Inventory item not found');
                            }
                            return [2 /*return*/, this.mapInventoryItem(opening)];
                    }
                });
            });
        };
        UsersService_1.prototype.sellInventoryItem = function (userId, openingId) {
            return __awaiter(this, void 0, void 0, function () {
                var opening, updatedOpening;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseOpening.findFirst({
                                where: {
                                    id: openingId,
                                    userId: userId,
                                },
                                include: {
                                    case: true,
                                    giftType: true,
                                },
                            })];
                        case 1:
                            opening = _a.sent();
                            if (!opening) {
                                throw new common_1.NotFoundException('Inventory item not found');
                            }
                            if (opening.status !== client_1.CaseOpeningStatus.OWNED) {
                                throw new common_1.BadRequestException('Only owned items can be sold');
                            }
                            return [4 /*yield*/, this.prisma.caseOpening.update({
                                    where: { id: opening.id },
                                    data: {
                                        status: client_1.CaseOpeningStatus.SOLD,
                                        soldAmountTon: opening.giftType.estimatedValueTon,
                                        soldAt: new Date(),
                                    },
                                    include: {
                                        case: true,
                                        giftType: true,
                                    },
                                })];
                        case 2:
                            updatedOpening = _a.sent();
                            return [2 /*return*/, this.mapInventoryItem(updatedOpening)];
                    }
                });
            });
        };
        UsersService_1.prototype.requestWithdrawInventoryItem = function (userId, openingId) {
            return __awaiter(this, void 0, void 0, function () {
                var opening, updatedOpening;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseOpening.findFirst({
                                where: {
                                    id: openingId,
                                    userId: userId,
                                },
                                include: {
                                    case: true,
                                    giftType: true,
                                },
                            })];
                        case 1:
                            opening = _a.sent();
                            if (!opening) {
                                throw new common_1.NotFoundException('Inventory item not found');
                            }
                            if (opening.status !== client_1.CaseOpeningStatus.OWNED) {
                                throw new common_1.BadRequestException('Only owned items can be withdrawn');
                            }
                            return [4 /*yield*/, this.prisma.caseOpening.update({
                                    where: { id: opening.id },
                                    data: {
                                        status: client_1.CaseOpeningStatus.WITHDRAW_PENDING,
                                        withdrawalRequestedAt: new Date(),
                                    },
                                    include: {
                                        case: true,
                                        giftType: true,
                                    },
                                })];
                        case 2:
                            updatedOpening = _a.sent();
                            return [2 /*return*/, this.mapInventoryItem(updatedOpening)];
                    }
                });
            });
        };
        UsersService_1.prototype.mapInventoryItem = function (opening) {
            return {
                id: opening.id,
                status: opening.status.toLowerCase(),
                soldAmountTon: opening.soldAmountTon,
                soldAt: opening.soldAt,
                withdrawalRequestedAt: opening.withdrawalRequestedAt,
                withdrawnAt: opening.withdrawnAt,
                createdAt: opening.createdAt,
                case: {
                    id: opening.case.id,
                    slug: opening.case.slug,
                    name: opening.case.name,
                    priceTon: opening.case.priceTon,
                    image: opening.case.image,
                    badgeGradient: opening.case.badgeGradient,
                },
                reward: {
                    id: opening.giftType.id,
                    telegramGiftTypeId: opening.giftType.telegramGiftTypeId,
                    name: opening.giftType.name,
                    image: opening.giftType.image,
                    estimatedValueTon: opening.giftType.estimatedValueTon,
                    rarity: opening.giftType.rarity.toLowerCase(),
                    valueLabel: opening.giftType.valueLabel,
                    accent: opening.giftType.accent,
                    textColor: opening.giftType.textColor,
                },
            };
        };
        UsersService_1.prototype.mapHistoryEntry = function (opening) {
            return {
                id: opening.id,
                status: opening.status.toLowerCase(),
                createdAt: opening.createdAt,
                soldAmountTon: opening.soldAmountTon,
                case: {
                    slug: opening.case.slug,
                    name: opening.case.name,
                    image: opening.case.image,
                },
                reward: {
                    id: opening.giftType.id,
                    name: opening.giftType.name,
                    image: opening.giftType.image,
                    estimatedValueTon: opening.giftType.estimatedValueTon,
                    rarity: opening.giftType.rarity.toLowerCase(),
                },
            };
        };
        return UsersService_1;
    }());
    __setFunctionName(_classThis, "UsersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
}();
exports.UsersService = UsersService;

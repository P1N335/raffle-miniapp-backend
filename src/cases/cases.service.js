"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.CasesService = void 0;
var common_1 = require("@nestjs/common");
var node_crypto_1 = require("node:crypto");
var client_1 = require("@prisma/client");
var core_1 = require("@ton/core");
var cases_catalog_1 = require("./cases.catalog");
var TONCENTER_DEFAULT_BASE_URL = 'https://toncenter.com/api';
var TON_NANO = 1000000000n;
var PAYMENT_VALIDITY_SECONDS = 300;
var PAYMENT_EXPIRY_GRACE_SECONDS = 900;
var CasesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CasesService = _classThis = /** @class */ (function () {
        function CasesService_1(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(CasesService.name);
        }
        CasesService_1.prototype.onModuleInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.syncCatalog()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CasesService_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                var cases;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseDefinition.findMany({
                                where: {
                                    isActive: true,
                                },
                                include: {
                                    drops: {
                                        include: {
                                            giftType: true,
                                        },
                                        orderBy: {
                                            sortOrder: 'asc',
                                        },
                                    },
                                },
                                orderBy: {
                                    sortOrder: 'asc',
                                },
                            })];
                        case 1:
                            cases = _a.sent();
                            return [2 /*return*/, cases.map(function (caseItem) { return _this.mapCaseRecord(caseItem); })];
                    }
                });
            });
        };
        CasesService_1.prototype.findOne = function (slug) {
            return __awaiter(this, void 0, void 0, function () {
                var caseItem;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseDefinition.findUnique({
                                where: { slug: slug },
                                include: {
                                    drops: {
                                        include: {
                                            giftType: true,
                                        },
                                        orderBy: {
                                            sortOrder: 'asc',
                                        },
                                    },
                                },
                            })];
                        case 1:
                            caseItem = _a.sent();
                            if (!caseItem || !caseItem.isActive) {
                                throw new common_1.NotFoundException('Case not found');
                            }
                            return [2 /*return*/, this.mapCaseRecord(caseItem)];
                    }
                });
            });
        };
        CasesService_1.prototype.createPaymentIntent = function (slug, userId, walletAddress) {
            return __awaiter(this, void 0, void 0, function () {
                var caseItem, normalizedWallet, recipientAddress, validUntil, amountNano, paymentIntentId, reference, resolvedUserId, user, existingWalletOwner, paymentIntent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseDefinition.findUnique({
                                where: { slug: slug },
                            })];
                        case 1:
                            caseItem = _a.sent();
                            if (!caseItem || !caseItem.isActive) {
                                throw new common_1.NotFoundException('Case not found');
                            }
                            normalizedWallet = this.normalizeAddress(walletAddress);
                            recipientAddress = this.getRecipientAddressOrThrow();
                            validUntil = new Date(Date.now() + PAYMENT_VALIDITY_SECONDS * 1000);
                            amountNano = (BigInt(caseItem.priceTon) * TON_NANO).toString();
                            paymentIntentId = (0, node_crypto_1.randomUUID)();
                            reference = "casepay:".concat(paymentIntentId);
                            resolvedUserId = null;
                            if (!userId) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.prisma.user.findUnique({
                                    where: { id: userId },
                                    select: {
                                        id: true,
                                    },
                                })];
                        case 2:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            return [4 /*yield*/, this.prisma.user.findFirst({
                                    where: {
                                        tonWalletAddressRaw: normalizedWallet.raw,
                                        NOT: {
                                            id: userId,
                                        },
                                    },
                                    select: {
                                        id: true,
                                    },
                                })];
                        case 3:
                            existingWalletOwner = _a.sent();
                            if (existingWalletOwner) {
                                throw new common_1.BadRequestException('This TON wallet is already linked to another user');
                            }
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: userId },
                                    data: {
                                        tonWalletAddress: normalizedWallet.userFriendly,
                                        tonWalletAddressRaw: normalizedWallet.raw,
                                        tonWalletNetwork: this.getTonNetwork(),
                                        tonWalletConnectedAt: new Date(),
                                    },
                                })];
                        case 4:
                            _a.sent();
                            resolvedUserId = userId;
                            _a.label = 5;
                        case 5: return [4 /*yield*/, this.prisma.casePaymentIntent.create({
                                data: {
                                    id: paymentIntentId,
                                    userId: resolvedUserId,
                                    caseId: caseItem.id,
                                    caseSlug: caseItem.slug,
                                    caseName: caseItem.name,
                                    walletAddress: normalizedWallet.userFriendly,
                                    walletAddressRaw: normalizedWallet.raw,
                                    recipientAddress: recipientAddress.userFriendly,
                                    recipientAddressRaw: recipientAddress.raw,
                                    amountTon: caseItem.priceTon,
                                    amountNano: amountNano,
                                    reference: reference,
                                    validUntil: validUntil,
                                },
                            })];
                        case 6:
                            paymentIntent = _a.sent();
                            return [2 /*return*/, {
                                    paymentIntent: this.mapPaymentIntent(paymentIntent),
                                    transaction: {
                                        validUntil: Math.floor(validUntil.getTime() / 1000),
                                        messages: [
                                            {
                                                address: recipientAddress.userFriendly,
                                                amount: amountNano,
                                                payload: this.buildPaymentPayload(reference),
                                            },
                                        ],
                                    },
                                }];
                    }
                });
            });
        };
        CasesService_1.prototype.submitPaymentIntent = function (intentId, boc) {
            return __awaiter(this, void 0, void 0, function () {
                var paymentIntent, updatedIntent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.casePaymentIntent.findUnique({
                                where: { id: intentId },
                            })];
                        case 1:
                            paymentIntent = _a.sent();
                            if (!paymentIntent) {
                                throw new common_1.NotFoundException('Payment intent not found');
                            }
                            if (paymentIntent.status === client_1.CasePaymentStatus.CONFIRMED) {
                                return [2 /*return*/, {
                                        paymentIntent: this.mapPaymentIntent(paymentIntent),
                                    }];
                            }
                            return [4 /*yield*/, this.prisma.casePaymentIntent.update({
                                    where: { id: intentId },
                                    data: {
                                        status: client_1.CasePaymentStatus.SUBMITTED,
                                        submittedBoc: boc !== null && boc !== void 0 ? boc : paymentIntent.submittedBoc,
                                    },
                                })];
                        case 2:
                            updatedIntent = _a.sent();
                            return [2 /*return*/, {
                                    paymentIntent: this.mapPaymentIntent(updatedIntent),
                                }];
                    }
                });
            });
        };
        CasesService_1.prototype.getPaymentIntentStatus = function (intentId) {
            return __awaiter(this, void 0, void 0, function () {
                var paymentIntent, resolvedIntent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.casePaymentIntent.findUnique({
                                where: { id: intentId },
                                include: {
                                    opening: {
                                        include: {
                                            case: true,
                                            caseDrop: {
                                                include: {
                                                    giftType: true,
                                                },
                                            },
                                            giftType: true,
                                        },
                                    },
                                },
                            })];
                        case 1:
                            paymentIntent = _a.sent();
                            if (!paymentIntent) {
                                throw new common_1.NotFoundException('Payment intent not found');
                            }
                            return [4 /*yield*/, this.resolvePaymentIntent(paymentIntent)];
                        case 2:
                            resolvedIntent = _a.sent();
                            return [2 /*return*/, this.mapPaymentIntentStatusResponse(resolvedIntent)];
                    }
                });
            });
        };
        CasesService_1.prototype.findOpenings = function (userId_1) {
            return __awaiter(this, arguments, void 0, function (userId, limit) {
                var openings;
                var _this = this;
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.caseOpening.findMany({
                                where: userId ? { userId: userId } : undefined,
                                include: {
                                    case: true,
                                    caseDrop: {
                                        include: {
                                            giftType: true,
                                        },
                                    },
                                    giftType: true,
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                                take: Math.min(Math.max(limit, 1), 50),
                            })];
                        case 1:
                            openings = _a.sent();
                            return [2 /*return*/, openings.map(function (opening) { return ({
                                    id: opening.id,
                                    userId: opening.userId,
                                    createdAt: opening.createdAt,
                                    paymentIntentId: opening.paymentIntentId,
                                    case: {
                                        id: opening.case.id,
                                        slug: opening.case.slug,
                                        name: opening.case.name,
                                        priceTon: opening.case.priceTon,
                                    },
                                    reward: _this.mapRewardDrop(opening.caseDrop),
                                }); })];
                    }
                });
            });
        };
        CasesService_1.prototype.getWalletBalance = function (address) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedAddress, url, response, payload;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            normalizedAddress = this.normalizeAddress(address);
                            url = new URL('/api/v2/getAddressBalance', this.getTonCenterOrigin());
                            url.searchParams.set('address', normalizedAddress.userFriendly);
                            return [4 /*yield*/, fetch(url, {
                                    headers: this.getTonCenterHeaders(),
                                })];
                        case 1:
                            response = _a.sent();
                            if (!response.ok) {
                                throw new common_1.InternalServerErrorException('Failed to load TON wallet balance');
                            }
                            return [4 /*yield*/, response.json()];
                        case 2:
                            payload = (_a.sent());
                            if (!payload.ok || !payload.result) {
                                throw new common_1.InternalServerErrorException(payload.error || 'Failed to load TON wallet balance');
                            }
                            return [2 /*return*/, {
                                    address: normalizedAddress.userFriendly,
                                    addressRaw: normalizedAddress.raw,
                                    network: this.getTonNetwork().toLowerCase(),
                                    balanceNano: payload.result,
                                    balanceTon: formatTonAmount(payload.result),
                                }];
                    }
                });
            });
        };
        CasesService_1.prototype.resolvePaymentIntent = function (paymentIntent) {
            return __awaiter(this, void 0, void 0, function () {
                var expirationTime, matchingTransaction, existingOpening, caseItem, winningDrop, error_1, refreshedIntent;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (paymentIntent.opening) {
                                return [2 /*return*/, paymentIntent];
                            }
                            if (paymentIntent.status === client_1.CasePaymentStatus.EXPIRED ||
                                paymentIntent.status === client_1.CasePaymentStatus.FAILED) {
                                return [2 /*return*/, paymentIntent];
                            }
                            expirationTime = paymentIntent.validUntil.getTime() + PAYMENT_EXPIRY_GRACE_SECONDS * 1000;
                            if (!(Date.now() > expirationTime)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.casePaymentIntent.update({
                                    where: { id: paymentIntent.id },
                                    data: {
                                        status: client_1.CasePaymentStatus.EXPIRED,
                                    },
                                })];
                        case 1:
                            _c.sent();
                            return [2 /*return*/, __assign(__assign({}, paymentIntent), { status: client_1.CasePaymentStatus.EXPIRED })];
                        case 2:
                            _c.trys.push([2, 9, , 10]);
                            return [4 /*yield*/, this.findMatchingTransaction(paymentIntent)];
                        case 3:
                            matchingTransaction = _c.sent();
                            if (!matchingTransaction) {
                                return [2 /*return*/, paymentIntent];
                            }
                            return [4 /*yield*/, this.prisma.casePaymentIntent.update({
                                    where: { id: paymentIntent.id },
                                    data: {
                                        status: client_1.CasePaymentStatus.CONFIRMED,
                                        transactionHash: (_a = matchingTransaction.hash) !== null && _a !== void 0 ? _a : null,
                                        transactionLt: (_b = matchingTransaction.lt) !== null && _b !== void 0 ? _b : null,
                                        confirmedAt: new Date(),
                                    },
                                })];
                        case 4:
                            _c.sent();
                            return [4 /*yield*/, this.prisma.caseOpening.findUnique({
                                    where: {
                                        paymentIntentId: paymentIntent.id,
                                    },
                                })];
                        case 5:
                            existingOpening = _c.sent();
                            if (!!existingOpening) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.prisma.caseDefinition.findUnique({
                                    where: { id: paymentIntent.caseId },
                                    include: {
                                        drops: {
                                            include: {
                                                giftType: true,
                                            },
                                            orderBy: {
                                                sortOrder: 'asc',
                                            },
                                        },
                                    },
                                })];
                        case 6:
                            caseItem = _c.sent();
                            if (!caseItem || caseItem.drops.length === 0) {
                                throw new common_1.InternalServerErrorException('Case catalog is not ready for opening');
                            }
                            winningDrop = pickWeightedDrop(caseItem.drops);
                            return [4 /*yield*/, this.prisma.caseOpening.create({
                                    data: {
                                        userId: paymentIntent.userId,
                                        caseId: caseItem.id,
                                        caseDropId: winningDrop.id,
                                        giftTypeId: winningDrop.giftType.id,
                                        paymentIntentId: paymentIntent.id,
                                    },
                                })];
                        case 7:
                            _c.sent();
                            _c.label = 8;
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            error_1 = _c.sent();
                            this.logger.warn("TON payment verification for ".concat(paymentIntent.id, " failed: ").concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                            return [3 /*break*/, 10];
                        case 10: return [4 /*yield*/, this.prisma.casePaymentIntent.findUnique({
                                where: { id: paymentIntent.id },
                                include: {
                                    opening: {
                                        include: {
                                            case: true,
                                            caseDrop: {
                                                include: {
                                                    giftType: true,
                                                },
                                            },
                                            giftType: true,
                                        },
                                    },
                                },
                            })];
                        case 11:
                            refreshedIntent = _c.sent();
                            if (!refreshedIntent) {
                                throw new common_1.NotFoundException('Payment intent not found');
                            }
                            return [2 /*return*/, refreshedIntent];
                    }
                });
            });
        };
        CasesService_1.prototype.mapCaseRecord = function (caseItem) {
            var _this = this;
            return {
                id: caseItem.id,
                slug: caseItem.slug,
                name: caseItem.name,
                tagline: caseItem.tagline,
                shortDescription: caseItem.shortDescription,
                priceTon: caseItem.priceTon,
                image: caseItem.image,
                badgeGradient: caseItem.badgeGradient,
                buttonGradient: caseItem.buttonGradient,
                surfaceTint: caseItem.surfaceTint,
                rewards: caseItem.drops.map(function (drop) { return _this.mapRewardDrop(drop); }),
            };
        };
        CasesService_1.prototype.mapRewardDrop = function (drop) {
            return {
                id: drop.giftType.id,
                dropId: drop.id,
                telegramGiftTypeId: drop.giftType.telegramGiftTypeId,
                name: drop.giftType.name,
                image: drop.giftType.image,
                rarity: mapRewardRarityName(drop.giftType.rarity),
                chance: drop.chance,
                valueLabel: drop.giftType.valueLabel,
                estimatedValueTon: drop.giftType.estimatedValueTon,
                accent: drop.giftType.accent,
                textColor: drop.giftType.textColor,
            };
        };
        CasesService_1.prototype.mapPaymentIntent = function (paymentIntent) {
            return {
                id: paymentIntent.id,
                caseId: paymentIntent.caseId,
                caseSlug: paymentIntent.caseSlug,
                caseName: paymentIntent.caseName,
                walletAddress: paymentIntent.walletAddress,
                recipientAddress: paymentIntent.recipientAddress,
                amountTon: paymentIntent.amountTon,
                amountNano: paymentIntent.amountNano,
                reference: paymentIntent.reference,
                status: paymentIntent.status.toLowerCase(),
                validUntil: paymentIntent.validUntil,
                confirmedAt: paymentIntent.confirmedAt,
                createdAt: paymentIntent.createdAt,
            };
        };
        CasesService_1.prototype.mapPaymentIntentStatusResponse = function (paymentIntent) {
            var base = {
                paymentIntent: this.mapPaymentIntent(paymentIntent),
            };
            if (!paymentIntent.opening) {
                return base;
            }
            return __assign(__assign({}, base), { opening: {
                    id: paymentIntent.opening.id,
                    userId: paymentIntent.opening.userId,
                    createdAt: paymentIntent.opening.createdAt,
                    caseId: paymentIntent.opening.caseId,
                    caseDropId: paymentIntent.opening.caseDropId,
                    giftTypeId: paymentIntent.opening.giftTypeId,
                }, case: {
                    id: paymentIntent.opening.case.id,
                    slug: paymentIntent.opening.case.slug,
                    name: paymentIntent.opening.case.name,
                    priceTon: paymentIntent.opening.case.priceTon,
                    image: paymentIntent.opening.case.image,
                    badgeGradient: paymentIntent.opening.case.badgeGradient,
                    buttonGradient: paymentIntent.opening.case.buttonGradient,
                    surfaceTint: paymentIntent.opening.case.surfaceTint,
                }, reward: this.mapRewardDrop(paymentIntent.opening.caseDrop) });
        };
        CasesService_1.prototype.syncCatalog = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _i, GIFT_TYPE_CATALOG_1, gift, _a, CASE_CATALOG_1, caseItem, _b, _c, drop;
                var _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            _i = 0, GIFT_TYPE_CATALOG_1 = cases_catalog_1.GIFT_TYPE_CATALOG;
                            _h.label = 1;
                        case 1:
                            if (!(_i < GIFT_TYPE_CATALOG_1.length)) return [3 /*break*/, 4];
                            gift = GIFT_TYPE_CATALOG_1[_i];
                            return [4 /*yield*/, this.prisma.giftType.upsert({
                                    where: { id: gift.id },
                                    update: {
                                        telegramGiftTypeId: (_d = gift.telegramGiftTypeId) !== null && _d !== void 0 ? _d : null,
                                        name: gift.name,
                                        description: (_e = gift.description) !== null && _e !== void 0 ? _e : null,
                                        image: gift.image,
                                        rarity: mapRewardRarity(gift.rarity),
                                        estimatedValueTon: gift.estimatedValueTon,
                                        valueLabel: gift.valueLabel,
                                        accent: gift.accent,
                                        textColor: gift.textColor,
                                        isActive: true,
                                    },
                                    create: {
                                        id: gift.id,
                                        telegramGiftTypeId: (_f = gift.telegramGiftTypeId) !== null && _f !== void 0 ? _f : null,
                                        name: gift.name,
                                        description: (_g = gift.description) !== null && _g !== void 0 ? _g : null,
                                        image: gift.image,
                                        rarity: mapRewardRarity(gift.rarity),
                                        estimatedValueTon: gift.estimatedValueTon,
                                        valueLabel: gift.valueLabel,
                                        accent: gift.accent,
                                        textColor: gift.textColor,
                                        isActive: true,
                                    },
                                })];
                        case 2:
                            _h.sent();
                            _h.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            _a = 0, CASE_CATALOG_1 = cases_catalog_1.CASE_CATALOG;
                            _h.label = 5;
                        case 5:
                            if (!(_a < CASE_CATALOG_1.length)) return [3 /*break*/, 11];
                            caseItem = CASE_CATALOG_1[_a];
                            return [4 /*yield*/, this.prisma.caseDefinition.upsert({
                                    where: { id: caseItem.id },
                                    update: {
                                        slug: caseItem.slug,
                                        name: caseItem.name,
                                        tagline: caseItem.tagline,
                                        shortDescription: caseItem.shortDescription,
                                        priceTon: caseItem.priceTon,
                                        image: caseItem.image,
                                        badgeGradient: caseItem.badgeGradient,
                                        buttonGradient: caseItem.buttonGradient,
                                        surfaceTint: caseItem.surfaceTint,
                                        sortOrder: caseItem.sortOrder,
                                        isActive: true,
                                    },
                                    create: {
                                        id: caseItem.id,
                                        slug: caseItem.slug,
                                        name: caseItem.name,
                                        tagline: caseItem.tagline,
                                        shortDescription: caseItem.shortDescription,
                                        priceTon: caseItem.priceTon,
                                        image: caseItem.image,
                                        badgeGradient: caseItem.badgeGradient,
                                        buttonGradient: caseItem.buttonGradient,
                                        surfaceTint: caseItem.surfaceTint,
                                        sortOrder: caseItem.sortOrder,
                                        isActive: true,
                                    },
                                })];
                        case 6:
                            _h.sent();
                            _b = 0, _c = caseItem.drops;
                            _h.label = 7;
                        case 7:
                            if (!(_b < _c.length)) return [3 /*break*/, 10];
                            drop = _c[_b];
                            return [4 /*yield*/, this.prisma.caseDrop.upsert({
                                    where: { id: drop.id },
                                    update: {
                                        caseId: caseItem.id,
                                        giftTypeId: drop.giftTypeId,
                                        chance: drop.chance,
                                        sortOrder: drop.sortOrder,
                                    },
                                    create: {
                                        id: drop.id,
                                        caseId: caseItem.id,
                                        giftTypeId: drop.giftTypeId,
                                        chance: drop.chance,
                                        sortOrder: drop.sortOrder,
                                    },
                                })];
                        case 8:
                            _h.sent();
                            _h.label = 9;
                        case 9:
                            _b++;
                            return [3 /*break*/, 7];
                        case 10:
                            _a++;
                            return [3 /*break*/, 5];
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        CasesService_1.prototype.buildPaymentPayload = function (reference) {
            return (0, core_1.beginCell)()
                .storeUint(0, 32)
                .storeStringTail(reference)
                .endCell()
                .toBoc()
                .toString('base64');
        };
        CasesService_1.prototype.findMatchingTransaction = function (paymentIntent) {
            return __awaiter(this, void 0, void 0, function () {
                var url, response, payload, transactions;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            url = new URL('/api/v3/transactions', this.getTonCenterOrigin());
                            url.searchParams.set('account', paymentIntent.recipientAddress);
                            url.searchParams.set('limit', '25');
                            url.searchParams.set('start_utime', String(Math.max(Math.floor(paymentIntent.createdAt.getTime() / 1000) - 120, 0)));
                            url.searchParams.set('sort', 'desc');
                            return [4 /*yield*/, fetch(url, {
                                    headers: this.getTonCenterHeaders(),
                                })];
                        case 1:
                            response = _b.sent();
                            if (!response.ok) {
                                throw new Error("TON Center verification failed with status ".concat(response.status));
                            }
                            return [4 /*yield*/, response.json()];
                        case 2:
                            payload = (_b.sent());
                            transactions = (_a = payload.transactions) !== null && _a !== void 0 ? _a : [];
                            return [2 /*return*/, transactions.find(function (transaction) {
                                    var _a;
                                    var inboundMessage = transaction.in_msg;
                                    if (!(inboundMessage === null || inboundMessage === void 0 ? void 0 : inboundMessage.source) || !inboundMessage.value) {
                                        return false;
                                    }
                                    var sourceRaw;
                                    try {
                                        sourceRaw = _this.normalizeAddress(inboundMessage.source).raw;
                                    }
                                    catch (_b) {
                                        return false;
                                    }
                                    if (sourceRaw !== paymentIntent.walletAddressRaw) {
                                        return false;
                                    }
                                    if (BigInt(inboundMessage.value) < BigInt(paymentIntent.amountNano)) {
                                        return false;
                                    }
                                    var comment = _this.parseTransactionComment((_a = inboundMessage.message_content) === null || _a === void 0 ? void 0 : _a.body);
                                    return comment === paymentIntent.reference;
                                })];
                    }
                });
            });
        };
        CasesService_1.prototype.parseTransactionComment = function (body) {
            if (!body) {
                return null;
            }
            try {
                var slice = core_1.Cell.fromBase64(body).beginParse();
                if (slice.remainingBits < 32) {
                    return null;
                }
                var opcode = slice.loadUint(32);
                if (opcode !== 0) {
                    return null;
                }
                return slice.loadStringTail();
            }
            catch (_a) {
                return null;
            }
        };
        CasesService_1.prototype.normalizeAddress = function (address) {
            try {
                var parsed = core_1.Address.parse(address);
                var testOnly = this.getTonNetwork() === client_1.TonNetwork.TESTNET;
                return {
                    raw: parsed.toRawString(),
                    userFriendly: parsed.toString({
                        urlSafe: true,
                        bounceable: false,
                        testOnly: testOnly,
                    }),
                };
            }
            catch (_a) {
                throw new common_1.BadRequestException('Invalid TON wallet address');
            }
        };
        CasesService_1.prototype.getRecipientAddressOrThrow = function () {
            var _a;
            var address = (_a = process.env.TON_RECIPIENT_ADDRESS) === null || _a === void 0 ? void 0 : _a.trim();
            if (!address) {
                throw new common_1.BadRequestException('TON_RECIPIENT_ADDRESS is not configured');
            }
            return this.normalizeAddress(address);
        };
        CasesService_1.prototype.getTonNetwork = function () {
            return process.env.TON_NETWORK === 'testnet'
                ? client_1.TonNetwork.TESTNET
                : client_1.TonNetwork.MAINNET;
        };
        CasesService_1.prototype.getTonCenterOrigin = function () {
            var _a, _b;
            return ((_b = (_a = process.env.TONCENTER_API_BASE_URL) === null || _a === void 0 ? void 0 : _a.trim().replace(/\/+$/, '')) !== null && _b !== void 0 ? _b : TONCENTER_DEFAULT_BASE_URL);
        };
        CasesService_1.prototype.getTonCenterHeaders = function () {
            var _a;
            var apiKey = (_a = process.env.TONCENTER_API_KEY) === null || _a === void 0 ? void 0 : _a.trim();
            return apiKey ? { 'X-API-Key': apiKey } : undefined;
        };
        return CasesService_1;
    }());
    __setFunctionName(_classThis, "CasesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CasesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CasesService = _classThis;
}();
exports.CasesService = CasesService;
function pickWeightedDrop(drops) {
    var totalChance = drops.reduce(function (sum, drop) { return sum + drop.chance; }, 0);
    var random = Math.random() * totalChance;
    for (var _i = 0, drops_1 = drops; _i < drops_1.length; _i++) {
        var drop = drops_1[_i];
        random -= drop.chance;
        if (random <= 0) {
            return drop;
        }
    }
    return drops[drops.length - 1];
}
function mapRewardRarity(rarity) {
    switch (rarity) {
        case 'common':
            return client_1.CaseRewardRarity.COMMON;
        case 'rare':
            return client_1.CaseRewardRarity.RARE;
        case 'epic':
            return client_1.CaseRewardRarity.EPIC;
        case 'legendary':
            return client_1.CaseRewardRarity.LEGENDARY;
    }
}
function mapRewardRarityName(rarity) {
    return rarity.toLowerCase();
}
function formatTonAmount(balanceNano) {
    var whole = BigInt(balanceNano) / TON_NANO;
    var fraction = BigInt(balanceNano) % TON_NANO;
    if (fraction === 0n) {
        return whole.toString();
    }
    return "".concat(whole, ".").concat(fraction.toString().padStart(9, '0').replace(/0+$/, ''));
}

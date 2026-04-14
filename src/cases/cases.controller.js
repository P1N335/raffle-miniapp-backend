"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesController = void 0;
var common_1 = require("@nestjs/common");
var CasesController = function () {
    var _classDecorators = [(0, common_1.Controller)('cases')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _findAll_decorators;
    var _findOpenings_decorators;
    var _getWalletBalance_decorators;
    var _getPaymentIntentStatus_decorators;
    var _submitPaymentIntent_decorators;
    var _findOne_decorators;
    var _createPaymentIntent_decorators;
    var CasesController = _classThis = /** @class */ (function () {
        function CasesController_1(casesService) {
            this.casesService = (__runInitializers(this, _instanceExtraInitializers), casesService);
        }
        CasesController_1.prototype.findAll = function () {
            return this.casesService.findAll();
        };
        CasesController_1.prototype.findOpenings = function (userId, limit) {
            return this.casesService.findOpenings(userId, limit ? Number(limit) : undefined);
        };
        CasesController_1.prototype.getWalletBalance = function (address) {
            if (!address) {
                throw new common_1.BadRequestException('Wallet address is required');
            }
            return this.casesService.getWalletBalance(address);
        };
        CasesController_1.prototype.getPaymentIntentStatus = function (id) {
            return this.casesService.getPaymentIntentStatus(id);
        };
        CasesController_1.prototype.submitPaymentIntent = function (id, dto) {
            return this.casesService.submitPaymentIntent(id, dto.boc);
        };
        CasesController_1.prototype.findOne = function (slug) {
            return this.casesService.findOne(slug);
        };
        CasesController_1.prototype.createPaymentIntent = function (slug, dto) {
            return this.casesService.createPaymentIntent(slug, dto.userId, dto.walletAddress);
        };
        return CasesController_1;
    }());
    __setFunctionName(_classThis, "CasesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, common_1.Get)()];
        _findOpenings_decorators = [(0, common_1.Get)('openings')];
        _getWalletBalance_decorators = [(0, common_1.Get)('wallet-balance')];
        _getPaymentIntentStatus_decorators = [(0, common_1.Get)('payment-intents/:id')];
        _submitPaymentIntent_decorators = [(0, common_1.Post)('payment-intents/:id/submit')];
        _findOne_decorators = [(0, common_1.Get)(':slug')];
        _createPaymentIntent_decorators = [(0, common_1.Post)(':slug/payment-intents')];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOpenings_decorators, { kind: "method", name: "findOpenings", static: false, private: false, access: { has: function (obj) { return "findOpenings" in obj; }, get: function (obj) { return obj.findOpenings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWalletBalance_decorators, { kind: "method", name: "getWalletBalance", static: false, private: false, access: { has: function (obj) { return "getWalletBalance" in obj; }, get: function (obj) { return obj.getWalletBalance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPaymentIntentStatus_decorators, { kind: "method", name: "getPaymentIntentStatus", static: false, private: false, access: { has: function (obj) { return "getPaymentIntentStatus" in obj; }, get: function (obj) { return obj.getPaymentIntentStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitPaymentIntent_decorators, { kind: "method", name: "submitPaymentIntent", static: false, private: false, access: { has: function (obj) { return "submitPaymentIntent" in obj; }, get: function (obj) { return obj.submitPaymentIntent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPaymentIntent_decorators, { kind: "method", name: "createPaymentIntent", static: false, private: false, access: { has: function (obj) { return "createPaymentIntent" in obj; }, get: function (obj) { return obj.createPaymentIntent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CasesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CasesController = _classThis;
}();
exports.CasesController = CasesController;

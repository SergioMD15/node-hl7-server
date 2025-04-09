"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeServerOptions = normalizeServerOptions;
exports.normalizeListenerOptions = normalizeListenerOptions;
const node_hl7_client_1 = require("node-hl7-client");
const exception_js_1 = require("./exception.js");
const DEFAULT_SERVER_OPTS = {
    bindAddress: "0.0.0.0",
    encoding: "utf-8",
    ipv4: true,
    ipv6: false,
};
const DEFAULT_LISTENER_OPTS = {
    encoding: "utf-8",
};
/** @internal */
function normalizeServerOptions(props) {
    const merged = {
        ...DEFAULT_SERVER_OPTS,
        ...(props || {}),
    };
    if (merged.ipv4 === true && merged.ipv6 === true) {
        throw new exception_js_1.HL7ServerError("ipv4 and ipv6 both can't be set to be exclusive.");
    }
    if (typeof merged.bindAddress !== "string") {
        throw new exception_js_1.HL7ServerError("bindAddress is not valid string.");
    }
    else if (merged.bindAddress !== "localhost") {
        if (typeof merged.bindAddress !== "undefined" &&
            merged.ipv6 === true &&
            !(0, node_hl7_client_1.validIPv6)(merged.bindAddress)) {
            throw new exception_js_1.HL7ServerError("bindAddress is an invalid ipv6 address.");
        }
        if (typeof merged.bindAddress !== "undefined" &&
            merged.ipv4 === true &&
            !(0, node_hl7_client_1.validIPv4)(merged.bindAddress)) {
            throw new exception_js_1.HL7ServerError("bindAddress is an invalid ipv4 address.");
        }
    }
    return merged;
}
/** @internal */
function normalizeListenerOptions(props) {
    const merged = {
        ...DEFAULT_LISTENER_OPTS,
        ...(props || {}),
    };
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line
    if (typeof merged.name === "undefined") {
        merged.name = (0, node_hl7_client_1.randomString)();
    }
    else {
        if (nameFormat.test(merged.name)) {
            throw new exception_js_1.HL7ListenerError("name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.");
        }
    }
    if (typeof merged.mshOverrides === "object") {
        Object.entries(merged.mshOverrides).forEach(([_path, override]) => {
            if (typeof override !== "string" && typeof override !== "function") {
                throw new exception_js_1.HL7ListenerError("mshOverrides override value must be a string or a function.");
            }
        });
    }
    if (typeof merged.port === "undefined") {
        throw new exception_js_1.HL7ListenerError("port is not defined.");
    }
    if (typeof merged.port !== "number" || isNaN(merged.port)) {
        throw new exception_js_1.HL7ListenerError("port is not a valid number.");
    }
    (0, node_hl7_client_1.assertNumber)({ port: merged.port }, "port", 0, 65353);
    return merged;
}

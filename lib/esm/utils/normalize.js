import { assertNumber, randomString, validIPv4, validIPv6, } from "node-hl7-client";
import { HL7ListenerError, HL7ServerError } from "./exception.js";
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
export function normalizeServerOptions(props) {
    const merged = {
        ...DEFAULT_SERVER_OPTS,
        ...(props || {}),
    };
    if (merged.ipv4 === true && merged.ipv6 === true) {
        throw new HL7ServerError("ipv4 and ipv6 both can't be set to be exclusive.");
    }
    if (typeof merged.bindAddress !== "string") {
        throw new HL7ServerError("bindAddress is not valid string.");
    }
    else if (merged.bindAddress !== "localhost") {
        if (typeof merged.bindAddress !== "undefined" &&
            merged.ipv6 === true &&
            !validIPv6(merged.bindAddress)) {
            throw new HL7ServerError("bindAddress is an invalid ipv6 address.");
        }
        if (typeof merged.bindAddress !== "undefined" &&
            merged.ipv4 === true &&
            !validIPv4(merged.bindAddress)) {
            throw new HL7ServerError("bindAddress is an invalid ipv4 address.");
        }
    }
    return merged;
}
/** @internal */
export function normalizeListenerOptions(props) {
    const merged = {
        ...DEFAULT_LISTENER_OPTS,
        ...(props || {}),
    };
    const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line
    if (typeof merged.name === "undefined") {
        merged.name = randomString();
    }
    else {
        if (nameFormat.test(merged.name)) {
            throw new HL7ListenerError("name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.");
        }
    }
    if (typeof merged.mshOverrides === "object") {
        Object.entries(merged.mshOverrides).forEach(([_path, override]) => {
            if (typeof override !== "string" && typeof override !== "function") {
                throw new HL7ListenerError("mshOverrides override value must be a string or a function.");
            }
        });
    }
    if (typeof merged.port === "undefined") {
        throw new HL7ListenerError("port is not defined.");
    }
    if (typeof merged.port !== "number" || isNaN(merged.port)) {
        throw new HL7ListenerError("port is not a valid number.");
    }
    assertNumber({ port: merged.port }, "port", 0, 65353);
    return merged;
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendResponse = void 0;
const events_1 = __importDefault(require("events"));
const node_hl7_client_1 = require("node-hl7-client");
const hl7_1 = require("node-hl7-client/hl7");
const codec_js_1 = require("../../utils/codec.js");
const MSA_1_VALUES_v2_1 = ["AA", "AR", "AE"];
const MSA_1_VALUES_v2_x = ["CA", "CR", "CE"];
/**
 * Send Response
 * @since 1.0.0
 */
class SendResponse extends events_1.default {
    constructor(socket, message, mshOverrides) {
        super();
        this._ack = undefined;
        this._message = message;
        this._mshOverrides = mshOverrides;
        this._socket = socket;
        this._codec = new codec_js_1.MLLPCodec();
    }
    /**
     * Send Response back to End User
     * @since 1.0.0
     * @see {@link https://hl7-definition.caristix.com/v2/HL7v2.1/Tables/0008}
     * @param type
     * @param encoding
     * @example
     * If you are to confirm to the end user (client) that the message they sent was good and processed successfully.
     * you would send an "AA" style message (Application Accept).
     * Otherwise, send an "AR" (Application Reject) to tell the client the data was
     * not accepted/processed or send an "AE"
     * (Application Error) to tell the client your overall application had an error.
     * ```ts
     * const server = new Server({bindAddress: '0.0.0.0'})
     * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
     *  const messageReq = req.getMessage()
     *  await res.sendResponse("AA")
     * })
     *
     * or
     *
     * const server = new Server({bindAddress: '0.0.0.0'})
     * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
     *  const messageReq = req.getMessage()
     *  await res.sendResponse("AR")
     * })
     *
     * or
     *
     * const server = new Server({bindAddress: '0.0.0.0'})
     * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
     *  const messageReq = req.getMessage()
     *  await res.sendResponse("AE")
     * })
     *```
     *
     * "AE" (Application Error) will be automatically sent if there is a problem creating either an "AA" or "AR"
     * message from the original message sent because the original message structure sent wrong in the first place.
     */
    async sendResponse(type, encoding = "utf-8") {
        try {
            this._ack = this._createAckMessage(type, this._message);
        }
        catch (_e) {
            this._ack = this._createAEAckMessage();
        }
        this._codec.sendMessage(this._socket, this._ack.toString(), encoding);
        // we are sending a response back, why not?
        this.emit("response.sent");
    }
    /**
     * Get the Ack Message
     * @since 2.2.0
     * @remarks Get the acknowledged message that was sent to the client.
     * This could return undefined if accessed before sending the response
     */
    getAckMessage() {
        return this._ack;
    }
    /** @internal */
    _createAckMessage(type, message) {
        let specClass;
        const spec = message.get("MSH.12").toString();
        this._validateMSA1(spec, type);
        switch (spec) {
            case "2.1":
                specClass = new hl7_1.HL7_2_1();
                break;
            case "2.2":
                specClass = new hl7_1.HL7_2_2();
                break;
            case "2.3":
                specClass = new hl7_1.HL7_2_3();
                break;
            case "2.3.1":
                specClass = new hl7_1.HL7_2_3_1();
                break;
            case "2.4":
                specClass = new hl7_1.HL7_2_4();
                break;
            case "2.5":
                specClass = new hl7_1.HL7_2_5();
                break;
            case "2.5.1":
                specClass = new hl7_1.HL7_2_5_1();
                break;
            case "2.6":
                specClass = new hl7_1.HL7_2_6();
                break;
            case "2.7":
                specClass = new hl7_1.HL7_2_7();
                break;
            case "2.7.1":
                specClass = new hl7_1.HL7_2_7_1();
                break;
            case "2.8":
                specClass = new hl7_1.HL7_2_8();
                break;
        }
        const ackMessage = new node_hl7_client_1.Message({
            specification: specClass,
            messageHeader: {
                msh_9_1: "ACK",
                msh_9_2: message.get("MSH.9.2").toString(),
                msh_10: "ACK",
                msh_11_1: message.get("MSH.11.1").toString(),
            },
        });
        ackMessage.set("MSH.3", message.get("MSH.5").toString());
        ackMessage.set("MSH.4", message.get("MSH.6").toString());
        ackMessage.set("MSH.5", message.get("MSH.3").toString());
        ackMessage.set("MSH.6", message.get("MSH.4").toString());
        ackMessage.set("MSH.12", message.get("MSH.12").toString());
        // process MSH field overrides if set
        if (typeof this._mshOverrides === "object") {
            Object.entries(this._mshOverrides).forEach(([path, override]) => {
                ackMessage.set(`MSH.${path}`, typeof override === "function" ? override(message) : override);
            });
        }
        const segment = ackMessage.addSegment("MSA");
        segment.set("1", type);
        segment.set("2", message.get("MSH.10").toString());
        return ackMessage;
    }
    /** @internal */
    _validateMSA1(spec, type) {
        switch (spec) {
            case "2.1":
                if (!MSA_1_VALUES_v2_1.includes(type)) {
                    throw new Error(`Invalid MSA-1 value: ${type} for HL7 version 2.1`);
                }
                break;
            default:
                if (![...MSA_1_VALUES_v2_1, ...MSA_1_VALUES_v2_x].includes(type)) {
                    throw new Error(`Invalid MSA-1 value: ${type} for HL7 version ${spec}`);
                }
                break;
        }
    }
    /** @internal */
    _createAEAckMessage() {
        const ackMessage = new node_hl7_client_1.Message({
            messageHeader: {
                msh_9_1: "ACK",
                // There is not an MSH 9.2 for ACK a failure.
                // There should be.
                // So we are using Z99, which is not assigned yet.
                msh_9_2: "Z99",
                msh_9_3: "ACK",
                msh_10: "ACK",
                msh_11_1: "P",
            },
        });
        ackMessage.set("MSH.3", ""); // This would need to be set by the application. Maybe from the server class?
        ackMessage.set("MSH.4", ""); // This would need to be set by the application. Maybe from the server class?
        const segment = ackMessage.addSegment("MSA");
        segment.set("1", "AE");
        segment.set("2", (0, node_hl7_client_1.randomString)());
        return ackMessage;
    }
}
exports.SendResponse = SendResponse;
